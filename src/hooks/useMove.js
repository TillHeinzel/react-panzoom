import { useEffect, useState } from 'react';

import transform from '../helpers/produceStyle';
import produceBounding from '../helpers/produceBounding';
import { usePanZoom } from '../context';

const useMove = (ref, loading) => {
  const panZoomRef = ref.current;
  const [moving, setMoving] = useState(null);
  const {
    boundaryHorizontal,
    boundaryVertical,
    disabled,
    disabledMove,
    onChange,
    onPositionChange,
    positionRef,
    zoomRef,
  } = usePanZoom();

  // Handle mousedown + mouseup
  useEffect(() => {
    if (loading || disabled || disabledMove) return undefined;

    const mousedown = (e) => {
      const rect = ref.current.parentNode.getBoundingClientRect();
      setMoving({
        x: e.clientX - rect.x - (positionRef.current.x || 0),
        y: e.clientY - rect.y - (positionRef.current.y || 0),
      });
    };

    const mouseup = () => setMoving(null);

    const node = ref.current;
    if (!node) return undefined;

    node.parentNode.addEventListener('mousedown', mousedown);
    window.addEventListener('mouseup', mouseup);

    return () => {
      node.parentNode.removeEventListener('mousedown', mousedown);
      window.removeEventListener('mouseup', mouseup);
    };
  }, [disabled, disabledMove, loading]);

  // Handle mousemove
  useEffect(() => {
    if (loading || !moving) return undefined;

    const node = ref.current;

    const move = (e) => {
      const rect = ref.current.parentNode.getBoundingClientRect();
      const nextPosition = produceBounding({
        boundaryHorizontal,
        boundaryVertical,
        x: e.clientX - rect.x - moving.x,
        y: e.clientY - rect.y - moving.y,
        rect,
        zoom: zoomRef.current,
      });

      positionRef.current = nextPosition;
      panZoomRef.style.transform = transform({
        position: positionRef.current,
        zoom: zoomRef.current,
      });
      if (onChange) onChange({ position: { ...positionRef.current }, zoom: zoomRef.current });
      if (onPositionChange) onPositionChange({ position: { ...positionRef.current } });
    };

    node.parentNode.addEventListener('mousemove', move);

    return () => {
      node.parentNode.removeEventListener('mousemove', move);
    };
  }, [boundaryHorizontal, boundaryVertical, loading, moving, onChange, onPositionChange]);

  return positionRef;
};

export default useMove;
