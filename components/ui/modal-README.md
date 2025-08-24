# Custom Modal Component

A highly customizable, reusable modal component for React Native with iOS-style detent behavior, smooth animations, and theme support.

## Features

- **Draggable Interface**: Smooth drag-to-dismiss and detent switching
- **Multiple Detents**: Support for small, medium, and large modal sizes
- **iOS-style Behavior**: Native iOS modal interaction patterns
- **Theme Support**: Integrates with your existing theme system
- **Flexible Content**: Accepts any React component as children
- **Smooth Animations**: Powered by react-native-reanimated
- **Haptic Feedback**: Provides tactile feedback for interactions
- **Accessibility**: Proper focus management and screen reader support

## Basic Usage

```tsx
import Modal from './components/ui/modal';

const MyComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Button title="Open Modal" onPress={() => setIsVisible(true)} />

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title="My Modal"
      >
        <Text>Modal content goes here</Text>
      </Modal>
    </>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | `false` | Controls modal visibility |
| `onClose` | `() => void` | - | Called when modal should close |
| `title` | `string` | - | Modal title (required) |
| `children` | `React.ReactNode` | - | Modal content (required) |
| `style` | `ViewStyle` | - | Additional styles for the modal |
| `showCloseButton` | `boolean` | `true` | Whether to show the X close button |
| `enableDragToClose` | `boolean` | `true` | Whether dragging down can close the modal |

## Modal Behavior

The modal has a fixed height of 70% of screen height and supports:
- **Drag to close**: Drag down more than 25% of modal height or use high velocity
- **Smooth animations**: Spring-based animations with haptic feedback
- **Responsive design**: Adapts to your app's theme automatically

## Advanced Usage

### Without Close Button

```tsx
<Modal
  visible={isVisible}
  onClose={onClose}
  title="No Close Button"
  showCloseButton={false}
>
  <Content />
</Modal>
```

### Disable Drag to Close

```tsx
<Modal
  visible={isVisible}
  onClose={onClose}
  title="Fixed Modal"
  enableDragToClose={false}
>
  <Content />
</Modal>
```

## Example Components

Check out the included example components:

- `modal-example.tsx`: Complete authentication modal example
- `modal-usage-example.tsx`: Various usage patterns

## Dependencies

This component requires:

- `react-native-reanimated`
- `react-native-gesture-handler`
- `expo-blur` (for the blur effect)
- `expo-haptics` (for haptic feedback)
- `lucide-react-native` (for the X icon)

## Styling

The modal automatically adapts to your theme context. Make sure your theme includes:

```tsx
const theme = {
  background: "#FFFFFF", // or "#171717" for dark
  text: "#000000",      // or "#E5E5E5" for dark
  border: "#E5E5EA",    // or "#262626" for dark
};
```

## Platform Notes

- **iOS**: Full detent support with native feel
- **Android**: Adapted behavior maintaining functionality
- **Web**: Graceful degradation with touch/mouse support

## Performance

The modal uses `react-native-reanimated` for smooth 60fps animations and optimized gesture handling. The backdrop uses opacity interpolation for performance.

