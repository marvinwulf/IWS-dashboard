import React, { useState, useEffect, useCallback, useRef } from "react";

interface SelectorFaderProps {
  minValue: number;
  maxValue: number;
  initialValue: number;
  settingName: string;
  bgColor: string;
  dotColor: string;
  fgColor: string;
  apiDeviceParam: string;
  onFaderEdited: () => void; // New prop for handling fader edited
}

const SelectorFader: React.FC<SelectorFaderProps> = ({
  minValue,
  maxValue,
  initialValue,
  settingName,
  bgColor,
  fgColor,
  dotColor,
  apiDeviceParam,
  onFaderEdited, // Pass the prop
}) => {
  const [value, setValue] = useState(initialValue);
  const [dragging, setDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleApiCall = async (newValue: number) => {
    try {
      const response = await fetch("/api/fetchdb", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ devicename: apiDeviceParam, threshold: Math.round(newValue) }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("API call failed", error);
    }
  };

  // Dragging interaction functions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setDragging(true);
  };

  const handleMouseDrag = useCallback(
    (e: MouseEvent) => {
      if (dragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newValue = Math.min(maxValue, Math.max(minValue, ((e.clientX - rect.left) / rect.width) * (maxValue - minValue) + minValue));
        setValue(newValue);
      }
    },
    [dragging, minValue, maxValue]
  );

  const handleMouseRelease = useCallback(() => {
    setDragging(false);
    window.removeEventListener("mouseup", handleMouseRelease);
    window.removeEventListener("mousemove", handleMouseDrag);
    document.body.classList.remove("no-select");
  }, [value]);

  // Hook for dragging action
  useEffect(() => {
    if (dragging) {
      window.addEventListener("mouseup", handleMouseRelease);
      window.addEventListener("mousemove", handleMouseDrag);
      document.body.classList.add("no-select");
      onFaderEdited(); // Call the callback function when fader is dragged
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseRelease);
      window.removeEventListener("mousemove", handleMouseDrag);
      document.body.classList.remove("no-select");
    };
  }, [dragging, handleMouseDrag, handleMouseRelease, onFaderEdited]);

  // Click alternative to dragging
  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const newValue = Math.min(maxValue, Math.max(minValue, ((e.clientX - rect.left) / rect.width) * (maxValue - minValue) + minValue));
      setValue(newValue);
      handleApiCall(Math.round(newValue));
    }
  };

  // Input integer clamping and validation function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= minValue && newValue <= maxValue) {
      setValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
    handleApiCall(Math.round(Number(e.target.value)));
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div ref={sliderRef} className={`relative w-full h-2.5 cursor-pointer`} onMouseDown={handleMouseDown} onClick={handleClick}>
        <div
          className={`absolute top-0 left-0 h-full ${fgColor} rounded-l-full`}
          style={{
            width: `${((value - minValue) / (maxValue - minValue)) * 100}%`,
          }}
        />
        <div
          className={`absolute top-0 right-0 h-full ${bgColor} rounded-r-full`}
          style={{
            width: `${(1 - (value - minValue) / (maxValue - minValue)) * 100}%`,
          }}
        />
        <div className="relative mx-[5px]">
          <div
            className={`absolute top-[5px] left-0 aspect-square h-4 rounded-full border-ms-bg border-2 ${dotColor} transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: `${((value - minValue) / (maxValue - minValue)) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="flex justify-between gap-2 w-full items-center text-sm">
        <p className="font-bold">{settingName}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={Math.round(value)}
            min={minValue}
            max={maxValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-12 border border-ms-accent rounded-md text-center outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SelectorFader;