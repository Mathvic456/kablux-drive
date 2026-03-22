import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};

const PLANS = [
    {
        id: "standard",
        label: "Kablux Standard",
        description: "",
        icon: "package",
        badge: null,
    },
    {
        id: "premium",
        label: "Kablux Premium",
        description: "",
        icon: "star",
        badge: null,
    },
    {
        id: "business",
        label: "Kablux Business",
        description: "",
        icon: "briefcase",
        badge: null,
    },
];

export default function PlanSelector({ selectedPlan, onSelect, error }) {
    const [open, setOpen] = useState(false);

    const selected = PLANS.find((p) => p.id === selectedPlan);

    return (
        <View style={{ marginTop: Math.max(10, height * 0.012) }}>
            {/* Trigger */}
            <TouchableOpacity
                style={[
                    planStyles.trigger,
                    open && planStyles.triggerOpen,
                    error && planStyles.triggerError,
                ]}
                onPress={() => setOpen((v) => !v)}
                activeOpacity={0.8}
            >
                <Feather
                    name="layers"
                    size={scaleSize(20)}
                    color={selected ? "#fcbf24" : "#aaa"}
                    style={{ marginRight: scaleSize(10) }}
                />
                <Text
                    style={[
                        planStyles.triggerText,
                        { fontSize: scaleFont(14) },
                        selected && planStyles.triggerTextSelected,
                    ]}
                >
                    {selected ? selected.label : "Select a driver type"}
                </Text>
                <Feather
                    name={open ? "chevron-up" : "chevron-down"}
                    size={scaleSize(18)}
                    color="#aaa"
                />
            </TouchableOpacity>

            {/* Dropdown */}
            {open && (
                <View style={planStyles.dropdown}>
                    {PLANS.map((plan, index) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    planStyles.option,
                                    isSelected && planStyles.optionSelected,
                                    index < PLANS.length - 1 && planStyles.optionBorder,
                                ]}
                                onPress={() => {
                                    onSelect(plan.id);
                                    setOpen(false);
                                }}
                                activeOpacity={0.75}
                            >
                                {/* Left accent bar */}
                                {isSelected && <View style={planStyles.accentBar} />}

                                <View style={[planStyles.optionIconWrap, isSelected && planStyles.optionIconWrapSelected]}>
                                    <Feather
                                        name={plan.icon as any}
                                        size={scaleSize(16)}
                                        color={isSelected ? "#000" : "#aaa"}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[planStyles.optionLabel, { fontSize: scaleFont(13) }, isSelected && planStyles.optionLabelSelected]}>
                                        {plan.label}
                                    </Text>
                                    <Text style={[planStyles.optionDesc, { fontSize: scaleFont(11) }]}>
                                        {plan.description}
                                    </Text>
                                </View>

                                {plan.badge && (
                                    <View style={[planStyles.badge, isSelected && planStyles.badgeSelected]}>
                                        <Text style={[planStyles.badgeText, { fontSize: scaleFont(9) }]}>
                                            {plan.badge}
                                        </Text>
                                    </View>
                                )}

                                {isSelected && (
                                    <Feather
                                        name="check-circle"
                                        size={scaleSize(16)}
                                        color="#fcbf24"
                                        style={{ marginLeft: scaleSize(8) }}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {error ? (
                <Text style={[planStyles.errorText, { fontSize: scaleFont(12) }]}>{error}</Text>
            ) : null}
        </View>
    );
};

const planStyles = StyleSheet.create({
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        paddingHorizontal: Math.max(12, width * 0.03),
        minHeight: Math.max(50, height * 0.06),
        borderWidth: 1,
        borderColor: "#222",
    },
    triggerOpen: {
        borderColor: "#fcbf24",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    triggerError: {
        borderColor: "#ff4444",
    },
    triggerText: {
        flex: 1,
        color: "#aaa",
    },
    triggerTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },
    dropdown: {
        backgroundColor: "#161616",
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#fcbf24",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: "hidden",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Math.max(12, height * 0.015),
        paddingHorizontal: Math.max(12, width * 0.03),
        position: "relative",
    },
    optionSelected: {
        backgroundColor: "rgba(252, 191, 36, 0.07)",
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#222",
    },
    accentBar: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: "#fcbf24",
        borderRadius: 2,
    },
    optionIconWrap: {
        width: scaleSize(34),
        height: scaleSize(34),
        borderRadius: scaleSize(8),
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
        marginRight: scaleSize(12),
    },
    optionIconWrapSelected: {
        backgroundColor: "#fcbf24",
    },
    optionLabel: {
        color: "#ccc",
        fontWeight: "500",
        marginBottom: 2,
    },
    optionLabelSelected: {
        color: "#fff",
        fontWeight: "700",
    },
    optionDesc: {
        color: "#555",
    },
    badge: {
        backgroundColor: "#222",
        borderRadius: 4,
        paddingHorizontal: scaleSize(6),
        paddingVertical: scaleSize(2),
        marginRight: scaleSize(6),
    },
    badgeSelected: {
        backgroundColor: "rgba(252,191,36,0.15)",
    },
    badgeText: {
        color: "#fcbf24",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    errorText: {
        color: "#ff4444",
        marginBottom: Math.max(5, height * 0.008),
        marginLeft: Math.max(12, width * 0.03),
        marginTop: 2,
    },
});