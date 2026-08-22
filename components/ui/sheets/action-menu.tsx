import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { spacing, type } from "../../../constants/theme";
import { ThemeContext } from "../../../contexts/theme-context";
import Sheet from "../sheet";
interface Action {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}
interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: Action[];
}

const ActionMenu = ({ visible, onClose, actions }: ActionMenuProps) => {
  const { theme } = useContext(ThemeContext);

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        onClose();
      }}
      cancelVisible
      headerVisible={false}
    >
      <View style={styles.container}>
        {/* All actions in a vertical list */}
        {actions.map((action) => (
          <TouchableOpacity
            key={action.title}
            onPress={action.onPress}
            hitSlop={{ top: 16, bottom: 16, left: 20, right: 20 }}
          >
            <View style={styles.actionContainer}>
              {action.icon}
              <Text
                style={[
                  styles.title,
                  {
                    color: action.destructive ? theme.destructive : theme.text,
                  },
                ]}
              >
                {action.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Sheet>
  );
};

export default ActionMenu;

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxxl,
    marginVertical: -spacing.sm,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  title: {
    ...type.body,
  },
});
