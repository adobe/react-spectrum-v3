import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
  Provider,
  lightTheme,
  ActionButton,
  Flex,
  Grid,
  View,
} from "@adobe/react-spectrum";
import { ColorScheme } from "@react-types/provider";
import { useState } from "react";
import Moon from "@spectrum-icons/workflow/Moon";
import Light from "@spectrum-icons/workflow/Light";
import { ToastContainer } from "@react-spectrum/toast";
import {enableTableNestedRows} from '@react-stately/flags';
import {useRouter, type NextRouter} from 'next/router';
import {ColorSwatchPicker, ColorSwatch} from '@react-spectrum/color';

declare module '@adobe/react-spectrum' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<NextRouter['push']>[2]>
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<ColorScheme>("light");

  let router = useRouter();
  let themeIcons = { dark: <Moon />, light: <Light /> };
  let otherTheme: ColorScheme = theme === "light" ? "dark" : "light";
  enableTableNestedRows();

  return (
    <Provider
      theme={lightTheme}
      colorScheme={theme}
      router={{
        navigate: (href, opts) => router.push(href, undefined, opts),
        useHref: (href: string) => router.basePath + href
      }}
      locale="en">
      <Grid
        areas={["header", "content"]}
        columns={["1fr"]}
        rows={["size-200", "auto"]}
        gap="size-100"
      >
        <Flex
          direction="row"
          gap="size-100"
          justifyContent="end"
          margin="size-100"
        >
          <ActionButton
            aria-label={`Switch to ${otherTheme} mode.`}
            onPress={() => setTheme(otherTheme)}
          >
            {themeIcons[otherTheme]}
          </ActionButton>
        </Flex>
        <View>
        <ColorSwatchPicker defaultValue="#f00">
          <ColorSwatch color="#f00" />
          <ColorSwatch color="#0f0" />
          <ColorSwatch color="#0ff" />
          <ColorSwatch color="#00f" />
        </ColorSwatchPicker>
          <Component {...pageProps} />
        </View>
      </Grid>
      <ToastContainer />
    </Provider>
  );
}
export default MyApp;
