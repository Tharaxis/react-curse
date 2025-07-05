import { ReactNode, useState } from "react";
import Renderer, { Text, Canvas, useSize, Button, useInput } from "../dist/index.js";

export const Logo = (): ReactNode => {
  return (
    <Canvas width={4} height={5}>
      <Canvas.Point x={1} y={0} color="White" />
      <Canvas.Point x={2} y={0} color="#97b8d8" />
      <Canvas.Point x={0} y={1} color="White" />
      <Canvas.Point x={1} y={1} color="#074d76" />
      <Canvas.Point x={2} y={1} color="#074d76" />
      <Canvas.Point x={0} y={2} color="White" />
      <Canvas.Point x={0} y={3} color="#074d76" />
      <Canvas.Point x={1} y={3} color="White" />
      <Canvas.Point x={2} y={3} color="#97b8d8" />
      <Canvas.Point x={1} y={4} color="#074d76" />
      <Canvas.Point x={2} y={4} color="#074d76" />
    </Canvas>
  );
};

/** The console application header. */
export const Header = (): ReactNode => {
  const { width } = useSize();
 
  return (
    <Text block absolute x={0} y={0} width={width} height={4} background="Blue">
      <Text x={2} y={1}><Logo /></Text>
      <Text x={7} y={1}>
        <Text block color="White">JUDI Platform Frontend Build System</Text>
        <Text block color="White">Copyright © Capital Rx. All rights reserved.</Text>
      </Text>
    </Text>
  )
};

/** The test application. */
const App = (): ReactNode => {
  const { width } = useSize();

  const [tab, setTab] = useState(0);

  useInput(() => {

  }, []);

  return (
    <>
      <Header />
      <Text block background="Black" width={width} height={1}>
        <Button color={(tab === 0) ? "Black" : "White"} background={(tab === 0) ? "Green" : "Black"} onClick={() => setTab(0)}> About Module </Button>
        <Button color={(tab === 1) ? "Black" : "White"} background={(tab === 1) ? "Green" : "Black"} onClick={() => setTab(1)}> Build Output </Button>
      </Text>
      {(tab === 0) && (
      <Text block>
        The first page content.
      </Text>
      )}
      {(tab === 1) && (
      <Text block>
        The second page content.
      </Text>
      )}
    </>
  )
};

Renderer.render(<App />);