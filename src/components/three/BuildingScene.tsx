"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import type { FloorInteractionProps } from "./FloorHitboxes";
import type { UnitHighlight } from "./Tower";
import ViewerStatus from "./ViewerStatus";

const BuildingCanvas = dynamic(() => import("./BuildingCanvas"), {
  ssr: false,
  loading: () => <ViewerStatus />,
});

export default memo(function BuildingScene(props: FloorInteractionProps & { highlight?: UnitHighlight }) {
  return <BuildingCanvas hoveredFloor={props.hoveredFloor} selectedFloor={props.selectedFloor} onHoverChange={props.onHoverChange} onSelect={props.onSelect} />;
});
