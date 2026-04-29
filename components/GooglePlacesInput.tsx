import { Feather } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const API_KEY =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_GOOGLE_IOS_API_KEY
    : process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

type Prediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
};

export default function GooglePlacesInput({
  value,
  onChangeText,
  placeholder = "Address",
  error,
}: Props) {
  const { width } = useWindowDimensions();
  const scaleSize = (size: number) =>
    Math.round(size * Math.min(width / 375, 1.2));
  const scaleFont = (size: number) =>
    Math.round(size * Math.min(width / 375, 1.3));

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextFetch = useRef(false);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${API_KEY}&language=en`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.predictions?.length) {
        setPredictions(data.predictions.slice(0, 5));
        setShowDropdown(true);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch {
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      if (!text.trim()) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }
      if (suppressNextFetch.current) {
        suppressNextFetch.current = false;
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPredictions(text), 400);
    },
    [onChangeText, fetchPredictions]
  );

  const handleSelect = useCallback(
    (description: string) => {
      if (blurRef.current) clearTimeout(blurRef.current);
      suppressNextFetch.current = true;
      onChangeText(description);
      setPredictions([]);
      setShowDropdown(false);
    },
    [onChangeText]
  );

  const handleBlur = useCallback(() => {
    blurRef.current = setTimeout(() => setShowDropdown(false), 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurRef.current) clearTimeout(blurRef.current);
  }, []);

  const handleClear = useCallback(() => {
    onChangeText("");
    setPredictions([]);
    setShowDropdown(false);
  }, [onChangeText]);

  const iconSize = scaleSize(20);
  const inputH = scaleSize(50);

  const isOpen = showDropdown && predictions.length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          isOpen && styles.inputContainerOpen,
          !!error && !isOpen && styles.inputContainerError,
        ]}
      >
        <Feather name="map-pin" size={iconSize} color="#aaa" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { height: inputH, fontSize: scaleFont(14) }]}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          value={value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          returnKeyType="next"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#fcbf24" style={styles.sideIcon} />
        ) : value.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.sideIcon} hitSlop={8}>
            <Feather name="x" size={scaleSize(16)} color="#555" />
          </TouchableOpacity>
        ) : null}
      </View>

      {isOpen && (
        <View style={styles.dropdown}>
          {predictions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id}
              style={[styles.option, index < predictions.length - 1 && styles.optionBorder]}
              onPress={() => handleSelect(item.description)}
              activeOpacity={0.7}
            >
              <View style={styles.optionPin}>
                <Feather name="map-pin" size={scaleSize(14)} color="#fcbf24" />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[styles.optionMain, { fontSize: scaleFont(13) }]}
                  numberOfLines={1}
                >
                  {item.structured_formatting?.main_text ?? item.description}
                </Text>
                {item.structured_formatting?.secondary_text ? (
                  <Text
                    style={[styles.optionSub, { fontSize: scaleFont(11) }]}
                    numberOfLines={1}
                  >
                    {item.structured_formatting.secondary_text}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!error && (
        <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputContainerOpen: {
    borderColor: "#fcbf24",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputContainerError: {
    borderColor: "#ff4444",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: 8,
  },
  sideIcon: {
    padding: 8,
    marginLeft: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  optionPin: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(252, 191, 36, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  optionText: {
    flex: 1,
  },
  optionMain: {
    color: "#fff",
    fontWeight: "500",
    marginBottom: 2,
  },
  optionSub: {
    color: "#666",
  },
  errorText: {
    color: "#ff4444",
    marginTop: 4,
    marginLeft: 12,
    marginBottom: 5,
  },
});
