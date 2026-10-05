<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/banner.png" alt="react-native-island-toast: toasts that open like the Dynamic Island" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-island-toast"><img src="https://img.shields.io/npm/v/react-native-island-toast?color=34C759&label=npm&cacheSeconds=3600" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/gzip-%E2%89%88%206%20kB-34C759" alt="about 6 kB gzipped" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-0A84FF" alt="platforms" />
  <img src="https://img.shields.io/badge/types-TypeScript-0A84FF" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-8E8E93" alt="MIT license" />
</p>

<p align="center">
  <a href="https://911rs.github.io/react-island-toast/"><b>Live demo</b></a> ·
  <a href="#get-started">Get started</a> ·
  <a href="#examples">Examples</a> ·
  <a href="#customize">Customize</a> ·
  <a href="#api">API</a> ·
  <a href="https://github.com/911RS/react-island-toast">Web version</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/hero.gif" alt="An island opens on a big tick, then turns into the message" width="480" />
  <br />
  <sub>The live demo runs the web version in your browser: same island, same API. <a href="https://github.com/911RS/react-native-island-toast/blob/main/media/demo.mp4">Watch the 1-minute tour on a phone</a>.</sub>
</p>

## Why

- **One line.** `island.success('Saved')`, from anywhere, even outside React.
- **Tiny.** About 6 kB gzipped. Only Reanimated and safe-area-context as peers.
- **Smooth.** Runs on the UI thread with Reanimated. Open, morph and close are one continuous motion.
- **Always on top.** Stays above modals and sheets.
- **Yours.** Every color, size, font, timing and part can be changed.

## Get started

```sh
npm install react-native-island-toast react-native-reanimated react-native-safe-area-context
```

Most apps already have the last two. Expo sets up Reanimated for you; bare apps add its Babel plugin.

Mount the host once, then call `island` from anywhere:

```tsx
import { IslandHost, island } from 'react-native-island-toast';

export default function App() {
  return (
    <>
      <Navigation />
      <IslandHost />
    </>
  );
}

island.success('Order shipped', { body: 'Arrives Friday' });
island.error('Payment failed', { body: 'Card declined' });
island.info('New message', { body: 'From Sam' });
```

Works on iOS, Android and the web (react-native-web), with Expo or bare React Native 0.71+.

## Examples

<img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/showcase.png" alt="Success, error, promise, undo, custom icons, Arabic fonts and light theme islands" width="100%" />

<details>
<summary><b>Promise</b>: a spinner, then the result in the same island</summary>

```tsx
island.promise(upload(file), {
  loading: 'Uploading video',
  success: (res) => ({ title: 'Video uploaded', body: res.name }),
  error: (e) => ({ title: 'Upload failed', body: e.message }),
});
```

It returns your promise, so `await` and `.catch` work as usual.

</details>

<details>
<summary><b>Undo</b>: an action button that reads longer</summary>

```tsx
island.info('Message archived', {
  action: { label: 'Undo', icon: UndoIcon, onPress: restore },
});
```

With an action, the message reads 3.5 s instead of 1.6 s.

</details>

<details>
<summary><b>Update</b>: change a message that is on screen</summary>

```tsx
const id = island.info('Looking for a driver', { duration: Infinity });

island.update(id, {
  type: 'success',
  title: 'Driver found',
  body: 'Alex, 4 min away',
  duration: 2000,
});
```

</details>

<details>
<summary><b>Icons</b>: bring any icon set</summary>

```tsx
import { Ionicons } from '@expo/vector-icons';

island.success('Table booked', {
  icon: ({ size, color }) => <Ionicons name="restaurant" size={size} color={color} />,
});
```

`heroIcon` sets a different icon for the big opening.

</details>

<details>
<summary><b>Your own types</b>: register a type with its own colors</summary>

```tsx
<IslandProvider config={{ types: { upload: { light: { accent: '#BF5AF2' } } } }}>

island.show({ type: 'upload', title: 'Photo uploaded', icon: UploadIcon });
```

</details>

<details>
<summary><b>Fonts</b>: one for Latin, one for Arabic</summary>

```tsx
<IslandProvider
  config={{
    theme: {
      fontFamily: 'Inter-Regular',
      titleFontFamily: 'Inter-Bold',
      arabicFontFamily: 'Cairo-Regular',
      arabicTitleFontFamily: 'Cairo-Bold',
    },
  }}
>
```

Each line picks its font by script. Load the fonts the usual way (`expo-font` or bundled files).

</details>

<details>
<summary><b>Haptics</b>: plug in your own</summary>

```tsx
import * as Haptics from 'expo-haptics';

<IslandProvider
  config={{
    haptics: (type) =>
      Haptics.notificationAsync(
        type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
      ),
  }}
>
```

</details>

<details>
<summary><b>Modals</b>: one host per layer</summary>

```tsx
<Modal visible={open} statusBarTranslucent>
  <Checkout />
  <IslandHost />
</Modal>
```

A `Modal` opens in its own layer, so give it its own host. The newest host draws the island; when the modal closes, a message on screen carries on below without opening again. On Android, keep `statusBarTranslucent` so the island lines up.

</details>

<details>
<summary><b>Custom content</b>: replace any part with your own component</summary>

```tsx
island.show({
  title: 'Storage almost full',
  type: 'error',
  renderContent: ({ theme }) => <StorageBar value={0.92} color={theme.accent} />,
});
```

Slots: `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent`. Each gets `{ message, theme, dismiss }` and can use hooks.

</details>

## Customize

Wrap your app in `IslandProvider` and keep the host inside it. Every key is optional.

```tsx
<IslandProvider
  config={{
    preset: 'snappy',
    position: 'top',
    theme: { radius: 18, accent: '#FF9F0A' },
    darkTheme: { background: '#000' },
  }}
>
  <App />
  <IslandHost />
</IslandProvider>
```

**Presets:** `snappy` · `calm` · `bouncy` · `minimal` (no big icon).
Settings apply in layers: defaults → `theme` → `darkTheme` → `types[type]` → the message's own `theme`.

<details>
<summary><b>Behavior options</b></summary>

| Key | What it does | Default |
| --- | --- | --- |
| `queue` | `'replace-latest'`: the current one closes, the newest waits. `'queue-all'`: each in turn. `'replace-now'`: swap at once. | `'replace-latest'` |
| `position` | `'top'` or `'bottom'` | `'top'` |
| `offset` | Extra distance from the edge, in points | `0` |
| `tapToDismiss` | Tap the island to close it | `true` |
| `swipeToDismiss` | Swipe it toward the edge to close it | `true` |
| `direction` | `'ltr'` or `'rtl'`; follows `I18nManager` when unset | unset |
| `colorScheme` | `'auto'`, `'light'` or `'dark'` | `'auto'` |
| `accessibilityHint` | Screen reader hint for tapping the island | `'Dismiss'` |
| `haptics`, `sound` | `(type) => void`, called for each message | none |
| `onShow`, `onHide` | `(message) => void` | none |

</details>

<details>
<summary><b>Theme options</b></summary>

| Key | Default |
| --- | --- |
| `background` | `#0A0A0A` |
| `border` | `rgba(255,255,255,0.10)`, `0.20` in dark mode |
| `title`, `body` | `#FFFFFF`, `rgba(255,255,255,0.72)` |
| `accent` | success `#34C759`, error `#FF453A`, info `#0A84FF`, loading `#FFFFFF` |
| `iconDisc` | the accent at 15 % |
| `actionBackground`, `actionText` | the accent, `#0A0A0A` |
| `pillWidth`, `pillHeight` | `120`, `36` |
| `heroSize`, `heroIconSize`, `iconSize` | `116`, `64`, `20` |
| `maxWidth`, `maxWidthRatio` | `560`, `0.95` of the host's width |
| `radius`, `heroRadius` | `22`, `36` |
| `shadow` | a soft drop shadow (any `ViewStyle`) |
| `fontFamily`, `titleFontFamily`, `arabicFontFamily`, `arabicTitleFontFamily` | the system font |
| `titleStyle`, `bodyStyle` | any `TextStyle` |
| `icon`, `heroIcon` | built-in tick, warning sign, info sign, spinner |

</details>

<details>
<summary><b>Motion options</b></summary>

| Key | Default |
| --- | --- |
| `hero` | `true` |
| `heroHoldMs` | `900` |
| `readMs`, `readWithActionMs` | `1600`, `3500` |
| `open`, `morph` | `{ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }` or `{ type: 'timing', duration, easing }` with `Easing` from Reanimated |
| `reducedMotion` | `'system'`, `'always'` or `'never'` |

</details>

<details>
<summary><b>Options for one message</b></summary>

| Option | What it does | Default |
| --- | --- | --- |
| `body` | Second line | none |
| `icon`, `heroIcon` | Element, or `({ size, color }) => element` | by type |
| `action` | `{ label, onPress, icon? }` | none |
| `duration` | Reading time in ms; `Infinity` keeps it | `1600`, `3500` with an action |
| `hero` | Show the big icon first | `true` |
| `theme`, `motion` | Overrides for this message | none |
| `haptic` | `false` skips the haptics and sound hooks | `true` |
| `onShow`, `onHide` | Callbacks | none |
| `accessibilityLabel` | What screen readers say | title and body |
| `renderIcon` … `renderContent` | Slots | none |

</details>

## API

| Call | Returns |
| --- | --- |
| `island.success(title, options?)` · `.error` · `.info` | the message id |
| `island.show({ title, type?, ...options })` | the message id |
| `island.promise(promise, { loading, success, error })` | your promise |
| `island.update(id, changes)` | |
| `island.dismiss(id)` · `island.dismissAll()` | |
| `useIsland()` | the same API, plus `current` |
| `<IslandHost />` · `<IslandProvider config>` | |

Unknown ids are ignored, so `dismiss` and `update` are always safe.

## Accessibility

- VoiceOver and TalkBack hear each message when it reaches the screen, and again when it changes.
- The island is one button that closes it; its action is offered as a screen reader action and as the iOS magic tap.
- With Reduce Motion on, it simply fades in and out.

## Related

- **[react-island-toast](https://github.com/911RS/react-island-toast)**: the same island for React on the web.
- **[Live demo](https://911rs.github.io/react-island-toast/)** (web version), or run this package's example app: `yarn && yarn example web` (also `android` / `ios`).

## License

MIT
