import { Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface Props {
  cancelLabel: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  children: ReactNode;
}

const CLOSED_TRANSLATE_Y = 400;

export const BottomSheet = forwardRef<BottomSheetRef, Props>(
  ({ cancelLabel, confirmLabel, onCancel, onConfirm, children }, ref) => {
    const color = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    const overlayOpacity = useSharedValue(0);
    const sheetTranslateY = useSharedValue(CLOSED_TRANSLATE_Y);

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: sheetTranslateY.value }],
    }));

    useEffect(() => {
      if (!isMounted) {
        return;
      }

      overlayOpacity.set(0);
      sheetTranslateY.set(CLOSED_TRANSLATE_Y);
      overlayOpacity.set(withTiming(1, { duration: 200 }));
      sheetTranslateY.set(
        withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
      );
    }, [isMounted, overlayOpacity, sheetTranslateY]);

    const close = useCallback(
      (onComplete?: () => void) => {
        overlayOpacity.set(withTiming(0, { duration: 180 }));
        sheetTranslateY.set(
          withTiming(
            CLOSED_TRANSLATE_Y,
            { duration: 250, easing: Easing.in(Easing.cubic) },
            (finished) => {
              if (!finished) {
                return;
              }

              scheduleOnRN(setIsMounted, false);

              if (onComplete) {
                scheduleOnRN(onComplete);
              }
            },
          ),
        );
      },
      [overlayOpacity, sheetTranslateY],
    );

    useImperativeHandle(
      ref,
      () => ({
        open: () => setIsMounted(true),
        close: () => close(),
      }),
      [close],
    );

    const handleCancel = () => close(onCancel);
    const handleConfirm = () => close(onConfirm);

    if (!isMounted) {
      return null;
    }

    return (
      <Modal
        visible
        transparent
        animationType="none"
        onRequestClose={handleCancel}
      >
        <View style={styles.container}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          >
            <Pressable
              style={styles.overlayPressable}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            />
          </Animated.View>

          <Animated.View
            style={[styles.sheet, sheetStyle, { backgroundColor: color.card }]}
          >
            <View style={[styles.header, { borderBottomColor: color.border }]}>
              <Pressable
                onPress={handleCancel}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={[styles.cancelLabel, { color: color.primary }]}>
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <Text style={[styles.confirmLabel, { color: color.primary }]}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>

            {children}
          </Animated.View>
        </View>
      </Modal>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlayPressable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Radius.button,
    borderTopRightRadius: Radius.button,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    minHeight: TouchSize.min,
    justifyContent: "center",
  },
  cancelLabel: {
    fontSize: 18,
    fontFamily: Fonts.sans,
  },
  confirmLabel: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
});
