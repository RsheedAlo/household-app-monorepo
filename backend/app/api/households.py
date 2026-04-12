from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, HTTPException

from app.db.database import supabase, supabase_admin
from app.models.core import (
    Household,
    HouseholdMemberAdd,
    HouseholdMemberRoleUpdate,
    HouseholdCreate,
    HouseholdDetails,
    HouseholdInviteCreate,
    HouseholdPendingInvite,
    HouseholdInviteView,
    HouseholdMemberView,
    HouseholdUpdate,
)

router = APIRouter()


def require_supabase_admin():
    """Stellt sicher, dass ein Supabase-Admin-Client verfuegbar ist."""
    if supabase_admin is None:
        raise HTTPException(
            status_code=503,
            detail="SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert",
        )
    return supabase_admin


def get_auth_email_for_user(user_id: str) -> str:
    """Liest die Auth-E-Mail eines Users ueber den Supabase-Admin-Client."""
    admin_client = require_supabase_admin()
    try:
        response = admin_client.auth.admin.get_user_by_id(user_id)
        email = getattr(response.user, "email", None)
        if not email:
            raise HTTPException(status_code=404, detail="Keine Auth-E-Mail fuer diesen Nutzer gefunden")
        return email.strip().lower()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Nutzer-E-Mail: {exc}")


@router.post("/", response_model=Household)
def create_household(household_in: HouseholdCreate, user_id: str):
    """Erstellt einen neuen Haushalt in der Datenbank."""
    try:
        household_res = (
            supabase.table("households")
            .insert({"name": household_in.name, "created_by": user_id})
            .execute()
        )

        if not household_res.data:
            raise HTTPException(status_code=400, detail="Haushalt-Erstellung fehlgeschlagen")

        new_household = household_res.data[0]
        household_id = new_household["id"]

        member_res = (
            supabase.table("household_members")
            .insert({"household_id": household_id, "user_id": user_id, "role": "admin"})
            .execute()
        )

        if not member_res.data:
            raise HTTPException(status_code=400, detail="Haushalt konnte nicht erstellt werden.")

        return new_household
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler: {exc}")


@router.get("/user/{user_id}")
def get_user_households(user_id: str):
    """Holt alle Haushalte, in denen der User Mitglied ist."""
    try:
        res = (
            supabase.table("household_members")
            .select("role, households(id, name, created_by)")
            .eq("user_id", user_id)
            .execute()
        )

        if not res.data:
            return []

        my_households = []
        for item in res.data:
            if item.get("households"):
                my_households.append(
                    {
                        "id": item["households"]["id"],
                        "name": item["households"]["name"],
                        "created_by": item["households"].get("created_by"),
                        "role": item["role"],
                    }
                )

        return my_households
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Haushalte: {exc}")


@router.get("/{household_id}", response_model=HouseholdDetails)
def get_household_details(household_id: str, user_id: str):
    """Holt einen Haushalt mit Mitgliederliste, sofern der User Mitglied ist."""
    try:
        membership_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not membership_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        household_res = (
            supabase.table("households").select("id, name").eq("id", household_id).execute()
        )

        if not household_res.data:
            raise HTTPException(status_code=404, detail="Haushalt nicht gefunden")

        members_res = (
            supabase.table("household_members")
            .select("user_id, role, profiles(display_name)")
            .eq("household_id", household_id)
            .execute()
        )

        members = [
            HouseholdMemberView(
                user_id=item["user_id"],
                display_name=(item.get("profiles") or {}).get("display_name") or "Unbekannt",
                role=item["role"],
            )
            for item in members_res.data or []
        ]

        household = household_res.data[0]
        return HouseholdDetails(id=household["id"], name=household["name"], members=members)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Laden der Haushaltsdetails: {exc}"
        )


@router.patch("/{household_id}", response_model=Household)
def rename_household(household_id: str, household_in: HouseholdUpdate, user_id: str):
    """Benennt einen Haushalt um, sofern der User dort Admin ist."""
    try:
        membership_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not membership_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if membership_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen den Haushalt umbenennen")

        update_res = (
            supabase.table("households")
            .update({"name": household_in.name})
            .eq("id", household_id)
            .execute()
        )

        if not update_res.data:
            raise HTTPException(status_code=404, detail="Haushalt nicht gefunden")

        return update_res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Umbenennen des Haushalts: {exc}"
        )


@router.delete("/{household_id}")
def delete_household(household_id: str, user_id: str):
    """Loescht einen Haushalt, sofern der anfragende User der erzeugende Admin ist."""
    try:
        household_res = (
            supabase.table("households")
            .select("id, created_by")
            .eq("id", household_id)
            .execute()
        )

        if not household_res.data:
            raise HTTPException(status_code=404, detail="Haushalt nicht gefunden")

        requester_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not requester_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if requester_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen Haushalte loeschen")

        created_by = household_res.data[0].get("created_by")
        if not created_by:
            raise HTTPException(
                status_code=400,
                detail="Haushalt kann erst geloescht werden, wenn created_by sauber gesetzt ist",
            )

        if created_by != user_id:
            raise HTTPException(
                status_code=403,
                detail="Nur der erstellende Admin darf diesen Haushalt loeschen",
            )

        delete_res = (
            supabase.table("households")
            .delete()
            .eq("id", household_id)
            .execute()
        )

        if not delete_res.data:
            raise HTTPException(status_code=400, detail="Haushalt konnte nicht geloescht werden")

        return {"message": "Haushalt erfolgreich geloescht"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Loeschen des Haushalts: {exc}")


@router.delete("/{household_id}/members/{member_user_id}")
def remove_household_member(household_id: str, member_user_id: str, user_id: str):
    """Entfernt ein Mitglied aus einem Haushalt, sofern der anfragende User Admin ist."""
    try:
        requester_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not requester_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if requester_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen Mitglieder entfernen")

        if member_user_id == user_id:
            raise HTTPException(
                status_code=400,
                detail="Admins koennen sich in diesem Schritt nicht selbst entfernen",
            )

        target_res = (
            supabase.table("household_members")
            .select("id")
            .eq("household_id", household_id)
            .eq("user_id", member_user_id)
            .execute()
        )

        if not target_res.data:
            raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")

        (
            supabase.table("household_members")
            .delete()
            .eq("household_id", household_id)
            .eq("user_id", member_user_id)
            .execute()
        )

        return {"message": "Mitglied erfolgreich entfernt"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Entfernen des Mitglieds: {exc}"
        )


@router.patch("/{household_id}/members/{member_user_id}/role")
def update_household_member_role(
    household_id: str,
    member_user_id: str,
    role_update: HouseholdMemberRoleUpdate,
    user_id: str,
):
    """Aendert die Rolle eines Mitglieds, sofern der anfragende User Admin ist."""
    try:
        requester_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not requester_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if requester_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen Rollen aendern")

        target_res = (
            supabase.table("household_members")
            .select("user_id, role")
            .eq("household_id", household_id)
            .eq("user_id", member_user_id)
            .execute()
        )

        if not target_res.data:
            raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")

        target_member = target_res.data[0]
        new_role = role_update.role

        if target_member["role"] == new_role:
            return {"message": "Rolle unveraendert", "role": new_role}

        if member_user_id == user_id and target_member["role"] == "admin" and new_role != "admin":
            raise HTTPException(
                status_code=400,
                detail="Admins koennen sich in diesem Schritt nicht selbst herabstufen",
            )

        if target_member["role"] == "admin" and new_role != "admin":
            admin_count_res = (
                supabase.table("household_members")
                .select("user_id", count="exact")
                .eq("household_id", household_id)
                .eq("role", "admin")
                .execute()
            )

            admin_count = admin_count_res.count or 0
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Der letzte Admin kann nicht zu member herabgestuft werden",
                )

        update_res = (
            supabase.table("household_members")
            .update({"role": new_role})
            .eq("household_id", household_id)
            .eq("user_id", member_user_id)
            .execute()
        )

        if not update_res.data:
            raise HTTPException(status_code=400, detail="Rolle konnte nicht aktualisiert werden")

        return {"message": "Rolle erfolgreich aktualisiert", "role": new_role}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Aendern der Rolle: {exc}")


@router.post("/{household_id}/members")
def add_household_member(household_id: str, member_in: HouseholdMemberAdd, user_id: str):
    """Fuegt ein bestehendes Profil per user_id zu einem Haushalt hinzu, sofern der anfragende User Admin ist."""
    try:
        requester_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not requester_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if requester_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen Mitglieder hinzufuegen")

        profile_res = (
            supabase.table("profiles")
            .select("id, display_name")
            .eq("id", str(member_in.user_id))
            .execute()
        )

        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Kein Nutzer mit dieser user_id gefunden")

        existing_res = (
            supabase.table("household_members")
            .select("id")
            .eq("household_id", household_id)
            .eq("user_id", str(member_in.user_id))
            .execute()
        )

        if existing_res.data:
            raise HTTPException(status_code=400, detail="Dieser Nutzer ist bereits Mitglied")

        insert_res = (
            supabase.table("household_members")
            .insert(
                {
                    "household_id": household_id,
                    "user_id": str(member_in.user_id),
                    "role": "member",
                }
            )
            .execute()
        )

        if not insert_res.data:
            raise HTTPException(status_code=400, detail="Mitglied konnte nicht hinzugefuegt werden")

        return {
            "message": "Mitglied erfolgreich hinzugefuegt",
            "user_id": str(member_in.user_id),
            "display_name": profile_res.data[0].get("display_name") or "Unbekannt",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Hinzufuegen des Mitglieds: {exc}"
        )


@router.post("/{household_id}/invites", response_model=HouseholdInviteView)
def create_household_invite(household_id: str, invite_in: HouseholdInviteCreate, user_id: str):
    """Legt eine Einladung per E-Mail fuer einen Haushalt an, sofern der anfragende User Admin ist."""
    admin_client = require_supabase_admin()
    try:
        requester_res = (
            supabase.table("household_members")
            .select("role")
            .eq("household_id", household_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not requester_res.data:
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")

        if requester_res.data[0]["role"] != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins duerfen Einladungen erstellen")

        household_res = (
            supabase.table("households")
            .select("id")
            .eq("id", household_id)
            .execute()
        )

        if not household_res.data:
            raise HTTPException(status_code=404, detail="Haushalt nicht gefunden")

        normalized_email = invite_in.email.strip().lower()

        existing_invite_res = (
            supabase.table("household_invites")
            .select("id, status")
            .eq("household_id", household_id)
            .eq("email", normalized_email)
            .eq("status", "pending")
            .execute()
        )

        if existing_invite_res.data:
            raise HTTPException(status_code=400, detail="Fuer diese E-Mail existiert bereits eine offene Einladung")

        token = secrets.token_urlsafe(24)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        email_delivery_status = "not_sent"

        try:
            admin_client.auth.admin.invite_user_by_email(normalized_email)
            email_delivery_status = "sent"
        except Exception as exc:
            error_text = str(exc).lower()
            if "already" in error_text and "registered" in error_text:
                email_delivery_status = "existing_user"
            else:
                email_delivery_status = "failed"

        insert_res = (
            supabase.table("household_invites")
            .insert(
                {
                    "household_id": household_id,
                    "email": normalized_email,
                    "invited_by": user_id,
                    "role": "member",
                    "status": "pending",
                    "token": token,
                    "expires_at": expires_at,
                }
            )
            .execute()
        )

        if not insert_res.data:
            raise HTTPException(status_code=400, detail="Einladung konnte nicht erstellt werden")

        invite_row = insert_res.data[0]
        invite_row["email_delivery_status"] = email_delivery_status
        return invite_row
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Erstellen der Einladung: {exc}"
        )


@router.get("/invites/user/{user_id}", response_model=list[HouseholdPendingInvite])
def get_pending_invites_for_user(user_id: str):
    """Liefert offene Einladungen fuer die Auth-E-Mail des angegebenen Users."""
    try:
        normalized_email = get_auth_email_for_user(user_id)

        invites_res = (
            supabase.table("household_invites")
            .select("id, household_id, email, role, status, expires_at, created_at, households(name)")
            .eq("email", normalized_email)
            .eq("status", "pending")
            .execute()
        )

        pending_invites = []
        for item in invites_res.data or []:
            pending_invites.append(
                HouseholdPendingInvite(
                    id=item["id"],
                    household_id=item["household_id"],
                    household_name=(item.get("households") or {}).get("name") or "Unbekannter Haushalt",
                    email=item["email"],
                    role=item["role"],
                    status=item["status"],
                    expires_at=item["expires_at"],
                    created_at=item["created_at"],
                )
            )

        return pending_invites
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Fehler beim Laden offener Einladungen: {exc}"
        )


@router.post("/invites/{invite_id}/accept")
def accept_household_invite(invite_id: str, user_id: str):
    """Nimmt eine offene Einladung an und fuegt den Nutzer zum Haushalt hinzu."""
    try:
        normalized_email = get_auth_email_for_user(user_id)

        invite_res = (
            supabase.table("household_invites")
            .select("id, household_id, email, role, status, expires_at")
            .eq("id", invite_id)
            .execute()
        )

        if not invite_res.data:
            raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

        invite = invite_res.data[0]
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Diese Einladung ist nicht mehr offen")

        if invite["email"].strip().lower() != normalized_email:
            raise HTTPException(status_code=403, detail="Diese Einladung gehoert nicht zu diesem Nutzer")

        expires_at = datetime.fromisoformat(invite["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Diese Einladung ist abgelaufen")

        existing_member_res = (
            supabase.table("household_members")
            .select("id")
            .eq("household_id", invite["household_id"])
            .eq("user_id", user_id)
            .execute()
        )

        if not existing_member_res.data:
            insert_res = (
                supabase.table("household_members")
                .insert(
                    {
                        "household_id": invite["household_id"],
                        "user_id": user_id,
                        "role": invite["role"],
                    }
                )
                .execute()
            )

            if not insert_res.data:
                raise HTTPException(status_code=400, detail="Mitgliedschaft konnte nicht erstellt werden")

        (
            supabase.table("household_invites")
            .update({"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", invite_id)
            .execute()
        )

        return {"message": "Einladung angenommen", "household_id": invite["household_id"]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Annehmen der Einladung: {exc}")


@router.post("/invites/{invite_id}/decline")
def decline_household_invite(invite_id: str, user_id: str):
    """Lehnt eine offene Einladung ab."""
    try:
        normalized_email = get_auth_email_for_user(user_id)

        invite_res = (
            supabase.table("household_invites")
            .select("id, email, status")
            .eq("id", invite_id)
            .execute()
        )

        if not invite_res.data:
            raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

        invite = invite_res.data[0]
        if invite["status"] != "pending":
            raise HTTPException(status_code=400, detail="Diese Einladung ist nicht mehr offen")

        if invite["email"].strip().lower() != normalized_email:
            raise HTTPException(status_code=403, detail="Diese Einladung gehoert nicht zu diesem Nutzer")

        (
            supabase.table("household_invites")
            .update({"status": "declined"})
            .eq("id", invite_id)
            .execute()
        )

        return {"message": "Einladung abgelehnt"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Ablehnen der Einladung: {exc}")
