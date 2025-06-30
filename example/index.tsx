import { ReactNode } from "react";
import Renderer, { Text, useInput, useMouse } from "../dist/index.js";

/** The test application. */
const App = (): ReactNode => {
  useInput((input, key) => {
    if (key !== null) console.log(key);
    else if (input.length === 1) console.log(input);
    else console.log(input.split(""));
  }, []);

  useMouse((type, x, y) => {
    console.log(type, x, y);
  }, []);

  return (
    <Text y={3}>
      Hello World
    </Text>
  )
};

Renderer.render(<App />);