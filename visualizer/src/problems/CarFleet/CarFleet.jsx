import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./CarFleet.css";

const SOLUTION_CODE = [
  { line: 1, text: "def carFleet(target: int, position: List[int], speed: List[int]) -> int:" },
  { line: 2, text: "    if not position: return 0" },
  { line: 3, text: "    cars = sorted(zip(position, speed), reverse=True)" },
  { line: 4, text: "    stack = []" },
  { line: 5, text: "    for pos, spd in cars:" },
  { line: 6, text: "        time = (target - pos) / spd" },
  { line: 7, text: "        if not stack or time > stack[-1]:" },
  { line: 8, text: "            stack.append(time)" },
  { line: 9, text: "    return len(stack)" },
];

function generateSteps(target, positions, speeds) {
  const steps = [];

  if (!positions || positions.length === 0) {
    steps.push({
      phase: "error",
      activeLine: 2,
      message: "No cars provided",
      fleets: 0,
    });
    return steps;
  }

  // Create cars array with indices
  const cars = positions.map((pos, idx) => ({
    position: pos,
    speed: speeds[idx],
    originalIndex: idx,
  }));

  steps.push({
    phase: "init",
    activeLine: 1,
    message: `Initialize with target=${target}, ${cars.length} cars`,
    cars,
    sortedCars: null,
    stack: [],
    fleets: 0,
    currentCarIdx: null,
  });

  // Sort by position descending
  const sortedCars = [...cars].sort((a, b) => b.position - a.position);

  steps.push({
    phase: "sort",
    activeLine: 3,
    message: `Sort cars by position (descending)`,
    cars,
    sortedCars,
    stack: [],
    fleets: 0,
    currentCarIdx: null,
  });

  steps.push({
    phase: "create_stack",
    activeLine: 4,
    message: `Initialize empty stack to track fleets`,
    cars,
    sortedCars,
    stack: [],
    fleets: 0,
    currentCarIdx: null,
  });

  const stack = [];

  for (let i = 0; i < sortedCars.length; i++) {
    const { position: pos, speed: spd } = sortedCars[i];

    steps.push({
      phase: "process_car",
      activeLine: 5,
      message: `Process car at position ${pos} with speed ${spd}`,
      cars,
      sortedCars,
      stack: [...stack],
      currentCarIdx: i,
      currentPos: pos,
      currentSpd: spd,
      fleets: stack.length,
    });

    const time = (target - pos) / spd;

    steps.push({
      phase: "calc_time",
      activeLine: 6,
      message: `Calculate arrival time: (${target} - ${pos}) / ${spd} = ${time.toFixed(2)}`,
      cars,
      sortedCars,
      stack: [...stack],
      currentCarIdx: i,
      currentPos: pos,
      currentSpd: spd,
      currentTime: time,
      fleets: stack.length,
    });

    steps.push({
      phase: "check_stack",
      activeLine: 7,
      message: `Check if stack is empty or ${time.toFixed(2)} > ${stack.length > 0 ? stack[stack.length - 1].toFixed(2) : "N/A"}`,
      cars,
      sortedCars,
      stack: [...stack],
      currentCarIdx: i,
      currentPos: pos,
      currentSpd: spd,
      currentTime: time,
      fleets: stack.length,
    });

    if (!stack.length || time > stack[stack.length - 1]) {
      stack.push(time);

      steps.push({
        phase: "add_fleet",
        activeLine: 8,
        message: `New fleet formed! Add ${time.toFixed(2)} to stack (fleet count: ${stack.length})`,
        cars,
        sortedCars,
        stack: [...stack],
        currentCarIdx: i,
        currentPos: pos,
        currentSpd: spd,
        currentTime: time,
        fleets: stack.length,
      });
    } else {
      steps.push({
        phase: "car_merges",
        activeLine: 7,
        message: `Car merges with previous fleet (${time.toFixed(2)} <= ${stack[stack.length - 1].toFixed(2)})`,
        cars,
        sortedCars,
        stack: [...stack],
        currentCarIdx: i,
        currentPos: pos,
        currentSpd: spd,
        currentTime: time,
        fleets: stack.length,
      });
    }
  }

  steps.push({
    phase: "done",
    activeLine: 9,
    message: `Final fleet count: ${stack.length}`,
    cars,
    sortedCars,
    stack: [...stack],
    currentCarIdx: null,
    fleets: stack.length,
  });

  return steps;
}

const EXAMPLES = [
  {
    label: "Example 1",
    target: 12,
    positions: [10, 8, 0, 5, 3],
    speeds: [2, 4, 1, 1, 3],
  },
  {
    label: "Single Car",
    target: 10,
    positions: [3],
    speeds: [3],
  },
  {
    label: "All Same Speed",
    target: 10,
    positions: [5, 2, 0],
    speeds: [2, 2, 2],
  },
  {
    label: "Close Positions",
    target: 15,
    positions: [14, 13, 12, 11],
    speeds: [1, 2, 3, 4],
  },
];

export default function CarFleetVisualizer() {
  const [targetInput, setTargetInput] = useState("12");
  const [positionsInput, setPositionsInput] = useState("[10, 8, 0, 5, 3]");
  const [speedsInput, setSpeedsInput] = useState("[2, 4, 1, 1, 3]");

  const { target, positions, speeds, inputError } = useMemo(() => {
    try {
      const t = parseInt(targetInput);
      const pos = JSON.parse(positionsInput);
      const spd = JSON.parse(speedsInput);

      if (isNaN(t)) throw new Error("Target must be a number");
      if (!Array.isArray(pos) || !Array.isArray(spd))
        throw new Error("Positions and speeds must be arrays");
      if (pos.length !== spd.length)
        throw new Error("Positions and speeds must have same length");
      if (pos.length === 0) throw new Error("Must have at least one car");

      return { target: t, positions: pos, speeds: spd, inputError: "" };
    } catch (e) {
      return {
        target: null,
        positions: null,
        speeds: null,
        inputError: e.message,
      };
    }
  }, [targetInput, positionsInput, speedsInput]);

  const steps = useMemo(
    () =>
      target !== null && positions && speeds
        ? generateSteps(target, positions, speeds)
        : [],
    [target, positions, speeds]
  );

  const { currentStep, isPlaying, setCurrentStep, setIsPlaying } =
    usePlaybackState(steps);

  const currentStepData = steps[currentStep] || {};

  const handleLoadExample = useCallback(
    (target, positions, speeds) => {
      setTargetInput(target.toString());
      setPositionsInput(JSON.stringify(positions));
      setSpeedsInput(JSON.stringify(speeds));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    [setCurrentStep, setIsPlaying]
  );

  return (
    <div className="cf-shell">
      <div className="cf-container">
        <div className="cf-input-section">
          <div className="cf-panel">
            <div className="cf-panel-head">Input</div>
            <div className="cf-panel-body">
              <div className="cf-field">
                <span>target distance</span>
                <input
                  className="cf-input"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="e.g., 12"
                />
              </div>
              <div className="cf-field">
                <span>positions</span>
                <input
                  className="cf-input"
                  value={positionsInput}
                  onChange={(e) => setPositionsInput(e.target.value)}
                  placeholder="e.g., [10, 8, 0, 5, 3]"
                />
              </div>
              <div className="cf-field">
                <span>speeds</span>
                <input
                  className="cf-input"
                  value={speedsInput}
                  onChange={(e) => setSpeedsInput(e.target.value)}
                  placeholder="e.g., [2, 4, 1, 1, 3]"
                />
              </div>
              {inputError && <div className="cf-error">{inputError}</div>}
              <div className="cf-examples">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="cf-example-btn"
                    onClick={() =>
                      handleLoadExample(ex.target, ex.positions, ex.speeds)
                    }
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cf-visualization-section">
          <div className="cf-panel">
            <div className="cf-panel-head">Car Fleet Visualization</div>
            <div className="cf-panel-body">
              <div className="cf-track-container">
                <div className="cf-track-label">Target: {target}</div>
                <div className="cf-track">
                  {/* Target marker */}
                  <div className="cf-target-marker">{target}</div>

                  {/* Cars visualization */}
                  {currentStepData.sortedCars &&
                    currentStepData.sortedCars.map((car, idx) => (
                      <motion.div
                        key={`car-${idx}`}
                        className={`cf-car ${
                          currentStepData.currentCarIdx === idx ? "active" : ""
                        }`}
                        animate={{
                          left: `${(car.position / (target + 5)) * 100}%`,
                        }}
                        transition={{ duration: 0.3 }}
                        title={`Car ${idx}: pos=${car.position}, speed=${car.speed}`}
                      >
                        <div className="cf-car-label">
                          {car.speed}
                          <span className="cf-unit">km/h</span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Fleet stack visualization */}
              <div className="cf-stack-section">
                <div className="cf-stack-label">Fleet Stack (Arrival Times)</div>
                <div className="cf-stack-display">
                  {currentStepData.stack && currentStepData.stack.length > 0 ? (
                    <div className="cf-stack-items">
                      {currentStepData.stack.map((time, idx) => (
                        <motion.div
                          key={`fleet-${idx}`}
                          className="cf-fleet-item"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="cf-fleet-number">Fleet {idx + 1}</span>
                          <span className="cf-fleet-time">{time.toFixed(2)}h</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="cf-empty-stack">Stack is empty</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cf-info-section">
        <div className="cf-panel">
          <div className="cf-panel-head">Algorithm Trace</div>
          <div className="cf-panel-body">
            <div className="cf-trace-message">
              {currentStepData.message || "Ready to process cars"}
            </div>
            {currentStepData.currentTime !== undefined && (
              <div className="cf-trace-detail">
                <span>Arrival Time:</span> {currentStepData.currentTime.toFixed(2)}h
              </div>
            )}
            {currentStepData.currentPos !== undefined && (
              <div className="cf-trace-detail">
                <span>Position:</span> {currentStepData.currentPos} (Speed:{" "}
                {currentStepData.currentSpd})
              </div>
            )}
            {currentStepData.phase === "done" && (
              <div className="cf-trace-result">
                <span>Total Fleets:</span> {currentStepData.fleets}
              </div>
            )}
          </div>
        </div>
      </div>

      <PlaybackControls
        currentStep={currentStep}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onStepChange={setCurrentStep}
        onPlayPause={setIsPlaying}
        speed={1}
      />
    </div>
  );
}
