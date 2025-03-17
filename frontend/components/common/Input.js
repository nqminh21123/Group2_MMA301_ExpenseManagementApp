// frontend/components/common/Input.js
import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../../utils/constants";
import Icon from "react-native-vector-icons/Ionicons";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  style,
  inputStyle,
  labelStyle,
  multiline,
  numberOfLines,
  icon,
  showPasswordToggle,
  ...otherProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          multiline && { height: numberOfLines * 40 },
        ]}
      >
        {icon && (
          <Icon name={icon} size={20} color={COLORS.gray} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, inputStyle, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "none"}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...otherProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
          >
            <Icon
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: COLORS.dark,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.dark,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  icon: {
    marginLeft: 16,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  passwordToggle: {
    padding: 10,
  },
});

export default Input;
