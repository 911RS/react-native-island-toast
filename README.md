<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/banner.png" alt="react-native-island-toast: toasts that open like the Dynamic Island" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-island-toast"><img src="https://img.shields.io/npm/v/react-native-island-toast?color=34C759&label=npm" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/gzip-%E2%89%88%206%20kB-34C759" alt="about 6 kB gzipped" />
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-0A84FF" alt="platforms" />
  <img src="https://img.shields.io/badge/types-TypeScript-0A84FF" alt="TypeScript" />
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/react-native-island-toast?color=8E8E93" alt="license" /></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/hero.gif" alt="An island opens on a big tick, then turns into the message" width="440" />
  <br />
  <sub><a href="https://github.com/911RS/react-native-island-toast/blob/main/media/demo.mp4">▶ Watch the 1-minute tour</a></sub>
</p>

<p align="center">
  <b>Building for the web?</b> The same island for React DOM: <a href="https://github.com/911RS/react-island-toast"><b>react-island-toast</b></a>
</p>

<br />

```tsx
island.success('Order shipped', { body: 'Arrives Friday' });
```

One line, and a black island grows out of the top of the screen, pops a big icon, then turns into your message. When it is done, it folds back and fades away in one smooth motion.

<br />

<img src="https://raw.githubusercontent.com/911RS/react-native-island-toast/main/media/showcase.png" alt="Success, error, promise, undo, custom icons, Arabic fonts and light theme islands" width="100%" />

## Highlights

- **Tiny.** About 6 kB gzipped. No dependencies besides Reanimated and safe-area-context.
- **Smooth.** Runs on the UI thread with Reanimated. Every open, morph and close is one continuous motion.
- **Yours.** Colors, sizes, corners, fonts, timings, curves, icons. Themes per type, light and dark. Slots for every part.
- **Smart queue.** A new message closes the current one smoothly, then opens. Or queue them all, or replace at once.
- **Real-world ready.** Promises, live updates, undo, stays above modals, swipe and tap to dismiss, top or bottom.
- **For everyone.** Screen reader announcements, reduced motion, RTL, a separate font for Arabic.

## Install

```sh
npm install react-native-island-toast react-native-reanimated react-native-safe-area-context
```

Most apps already have the last two. Expo sets up Reanimated for you; bare apps add its Babel plugin.

## Quick start

**1.** Mount the host once, at the root:

```tsx
import { IslandHost } from 'react-native-island-toast';

export default function App() {
  return (
    <>
      <Navigation />
      <IslandHost />
    </>
  );
}
```

**2.** Show a message from anywhere, even outside React:

```tsx
import { island } from 'react-native-island-toast';

island.success('Order shipped', { body: 'Arrives Friday' });
island.error('Payment failed', { body: 'Card declined' });
island.info('New message', { body: 'From Sam' });
```

That's it.

## Recipes

### Promise

A spinner while it runs, then the result in the same island.

```tsx
island.promise(upload(file), {
  loading: 'Uploading video',
  success: (res) => ({ title: 'Video uploaded', body: res.name }),
  error: (e) => ({ title: 'Upload failed', body: e.message }),
});
```

It returns your promise, so `await` and `.catch` work as usual.

### Undo

```tsx
island.info('Message archived', {
  action: { label: 'Undo', icon: UndoIcon, onPress: restore },
});
```

With an action, the message reads longer (3.5 s instead of 1.6 s).

### Update a message on screen

```tsx
const id = island.info('Looking for a driver', { duration: Infinity });
// later
island.update(id, {
  type: 'success',
  title: 'Driver found',
  body: 'Alex, 4 min away',
  duration: 2000,
});
```

### Your own icons

No icon library inside: bring yours.

```tsx
import { Ionicons } from '@expo/vector-icons';

island.success('Table booked', {
  icon: ({ size, color }) => <Ionicons name="restaurant" size={size} color={color} />,
});
```

`heroIcon` sets a different icon for the big opening.

### Your own types

```tsx
<IslandProvider config={{ types: { upload: { light: { accent: '#BF5AF2' } } } }}>

island.show({ type: 'upload', title: 'Photo uploaded', icon: UploadIcon });
```

### Fonts, including Arabic

Each line picks its font: text with Arabic letters gets the Arabic font, everything else the Latin one.

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

### Above modals

A `Modal` opens in its own layer, so give it its own host. The newest host draws the island; when the modal closes, a message on screen carries on below without opening again.

```tsx
<Modal visible={open} statusBarTranslucent>
  <Checkout />
  <IslandHost />
</Modal>
```

On Android, keep `statusBarTranslucent` so the island lines up with the one below.

### Your own content

Replace any part with a slot. Slots are components, so they can use hooks.

```tsx
island.show({
  title: 'Storage almost full',
  type: 'error',
  renderContent: ({ theme }) => <StorageBar value={0.92} color={theme.accent} />,
});
```

Slots: `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent`. Each gets `{ message, theme, dismiss }`. Set them in `config` to change every message.

## Configuration

Wrap your app in `IslandProvider` to change the defaults. Every key is optional.

```tsx
<IslandProvider
  config={{
    preset: 'snappy',
    queue: 'replace-latest',
    theme: { radius: 18, accent: '#FF9F0A' },
    darkTheme: { background: '#000' },
    haptics: (type) => Haptics.notificationAsync(type === 'error' ? 'error' : 'success'),
  }}
>
  <App />
</IslandProvider>
```

Layers apply in order, each over the one before: library defaults → `theme` → `darkTheme` (in dark mode) → `types[type]` → the call's own `theme`.

**Presets:** `snappy` · `calm` · `bouncy` · `minimal` (no big icon).

<details>
<summary><b>Behavior</b></summary>

| Key | What it does | Default |
| --- | --- | --- |
| `queue` | `'replace-latest'`: the current one closes, the newest waits, older ones are dropped. `'queue-all'`: each one shows in turn. `'replace-now'`: swap at once. | `'replace-latest'` |
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
<summary><b>Theme</b></summary>

| Key | Default |
| --- | --- |
| `background` | `#0A0A0A` |
| `border` | `rgba(255,255,255,0.10)`, `0.20` in dark mode |
| `title`, `body` | `#FFFFFF`, `rgba(255,255,255,0.72)` |
| `accent` | success `#34C759`, error `#FF453A`, info `#0A84FF`, loading `#FFFFFF` |
| `iconDisc` | the accent at 15 % (needs a `#RGB` or `#RRGGBB` accent, else a neutral disc) |
| `actionBackground`, `actionText` | the accent, `#0A0A0A` |
| `pillWidth`, `pillHeight` | `120`, `36`: the resting size it opens from and folds back to |
| `heroSize`, `heroIconSize`, `iconSize` | `116`, `64`, `20` |
| `maxWidth`, `maxWidthRatio` | `560`, `0.95` of the host's width |
| `radius`, `heroRadius` | `22`, `36` |
| `shadow` | a soft drop shadow (any `ViewStyle`) |
| `fontFamily`, `titleFontFamily` | system font |
| `arabicFontFamily`, `arabicTitleFontFamily` | the Latin fonts |
| `titleStyle`, `bodyStyle` | none |
| `icon`, `heroIcon` | built-in tick, warning sign, info sign, spinner |

</details>

<details>
<summary><b>Motion</b></summary>

| Key | Default |
| --- | --- |
| `hero` | `true` |
| `heroHoldMs` | `900` |
| `readMs`, `readWithActionMs` | `1600`, `3500` |
| `open`, `morph` | `{ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }`, or `{ type: 'timing', duration, easing }` with `Easing` from Reanimated |
| `reducedMotion` | `'system'`: fade only when the phone asks for less motion. Or `'always'`, `'never'`. |

</details>

<details>
<summary><b>Options for one message</b></summary>

| Option | Type | Default |
| --- | --- | --- |
| `body` | `string` | none |
| `icon` | element, or `({ size, color }) => element` | by type |
| `heroIcon` | same, for the big opening | `icon` |
| `action` | `{ label, onPress, icon? }`; with an `icon`, only the icon shows | none |
| `duration` | reading time in ms; `Infinity` keeps it until dismissed | `1600`, `3500` with an action |
| `hero` | show the big icon first | `true` |
| `theme`, `motion` | partial overrides for this message | none |
| `haptic` | `false` skips the haptics and sound hooks | `true` |
| `onShow`, `onHide` | `() => void` | none |
| `accessibilityLabel` | what screen readers say | title and body |
| slots | `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent` | none |

</details>

## API

| Call | Returns |
| --- | --- |
| `island.success(title, options?)` · `.error` · `.info` | the message id |
| `island.show({ title, type?, ...options })` | the message id |
| `island.promise(promise, { loading, success, error })` | your promise |
| `island.update(id, changes)` | |
| `island.dismiss(id)` · `island.dismissAll()` | |
| `useIsland()` | the same API, plus `current`: the message on screen |
| `<IslandHost />` · `<IslandProvider config>` | |

Unknown ids are ignored, so `dismiss` and `update` are always safe to call.

## Accessibility

- Screen readers hear each message when it reaches the screen, and again when it changes (so a promise's result is heard too).
- The island is one button that closes it; its action is offered as a screen reader action and as the iOS magic tap.
- With Reduce Motion on, it simply fades in and out.

## Example app

```sh
git clone https://github.com/911RS/react-native-island-toast && cd react-native-island-toast
yarn && yarn example web
```

Every option in this README has a button there. `yarn example android` and `yarn example ios` work too.

## Also for the web

The same island, API and options for React DOM (Vite, Next.js, Remix): [react-island-toast](https://github.com/911RS/react-island-toast).

## License

MIT
