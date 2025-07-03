import { ReactNode } from "react";
import Renderer, { Text, useInput, useMouse } from "../dist/index.js";

/** The test application. */
const App = (): ReactNode => {
  useInput((event) => {
    console.log(event);
  }, []);

  useMouse((event) => {
    console.log(event);
  }, []);

  return (
    <Text y={3}>
      Hello World
    </Text>
  )
};

Renderer.render(<App />);