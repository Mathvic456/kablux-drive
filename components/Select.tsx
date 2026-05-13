import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");

const scaleFont = (size: number) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size: number) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};

export type SelectOption = { value: string; label: string };

type SelectProps = {
    icon?: keyof typeof Feather.glyphMap;
    label: string;
    placeholder?: string;
    value: string | null;
    options: SelectOption[];
    onSelect: (value: string) => void;
    error?: string;
};

export default function Select({
    icon,
    label,
    placeholder = "Select an option",
    value,
    options,
    onSelect,
    error,
}: SelectProps) {
    const [open, setOpen] = useState(false);

    const selected = options.find((o) => o.value === value) || null;

    return (
        <View style={{ marginTop: Math.max(10, height * 0.012) }}>
            <Text style={[styles.label, { fontSize: scaleFont(13) }]}>{label}</Text>

            <TouchableOpacity
                style={[
                    styles.trigger,
                    open && styles.triggerOpen,
                    error && styles.triggerError,
                ]}
                onPress={() => setOpen((v) => !v)}
                activeOpacity={0.8}
            >
                {icon ? (
                    <Feather
                        name={icon}
                        size={scaleSize(20)}
                        color={selected ? "#fcbf24" : "#aaa"}
                        style={{ marginRight: scaleSize(10) }}
                    />
                ) : null}
                <Text
                    style={[
                        styles.triggerText,
                        { fontSize: scaleFont(14) },
                        selected && styles.triggerTextSelected,
                    ]}
                >
                    {selected ? selected.label : placeholder}
                </Text>
                <Feather
                    name={open ? "chevron-up" : "chevron-down"}
                    size={scaleSize(18)}
                    color="#aaa"
                />
            </TouchableOpacity>

            {open && (
                <View style={styles.dropdown}>
                    {options.map((opt, index) => {
                        const isSelected = value === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.option,
                                    isSelected && styles.optionSelected,
                                    index < options.length - 1 && styles.optionBorder,
                                ]}
                                onPress={() => {
                                    onSelect(opt.value);
                                    setOpen(false);
                                }}
                                activeOpacity={0.75}
                            >
                                {isSelected && <View style={styles.accentBar} />}

                                <Text
                                    style={[
                                        styles.optionLabel,
                                        { fontSize: scaleFont(13) },
                                        isSelected && styles.optionLabelSelected,
                                    ]}
                                >
                                    {opt.label}
                                </Text>

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
                <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{error}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        color: "#ccc",
        marginBottom: 6,
        marginLeft: 2,
        fontWeight: "500",
    },
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
    optionLabel: {
        flex: 1,
        color: "#ccc",
        fontWeight: "500",
        marginLeft: scaleSize(8),
    },
    optionLabelSelected: {
        color: "#fff",
        fontWeight: "700",
    },
    errorText: {
        color: "#ff4444",
        marginBottom: Math.max(5, height * 0.008),
        marginLeft: Math.max(12, width * 0.03),
        marginTop: 2,
    },
});
