import HouseholdsSection from "../components/HouseholdsSection";

export default function HouseholdsOverview({
    userId,
    households,
    activeHousehold,
    refreshHouseholds,
    setActiveHousehold,
}) {
    return (
        <div className="stack-layout">
            <HouseholdsSection
                userId={userId}
                households={households}
                activeHousehold={activeHousehold}
                refreshHouseholds={refreshHouseholds}
                setActiveHousehold={setActiveHousehold}
            />
        </div>
    );
}
