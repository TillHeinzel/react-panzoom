import React, {
  forwardRef, MutableRefObject, useLayoutEffect,
} from 'react';
import initPanZoom, { getAllowedProps } from 'panzoom-core';

import {
  PanZoomApi, PanZoomWithCoverProps, PanZoomWithCoverOmit, PanZoomWithCoverPropsRef,
} from 'types';
import usePanZoom from './usePanZoom';

const omitFields = ['boundary'];
const panZoomWithCoverAllowedProps = getAllowedProps()
  .filter((propName) => !omitFields.includes(propName)) as Array<keyof PanZoomWithCoverOmit>;

const PanZoomWithCover: React.FC<
  PanZoomWithCoverProps & { apiRef?: MutableRefObject<PanZoomApi>
}> = ({
  apiRef,
  children,
  cover,
  onCoverLoad,
  ...props
}) => {
  const {
    childRef, parentRef, panZoomRef, render, setInitialized,
  } = usePanZoom({
    apiRef,
    allowedProps: panZoomWithCoverAllowedProps,
    children,
    props,
  });

  useLayoutEffect(() => {
    setInitialized(false);

    const image = new Image();
    image.src = cover;
    const imageDimensionsKnownHandler = () => {
      const containerNode = parentRef.current.parentNode as HTMLElement;
      const containerSize = containerNode.getBoundingClientRect();

      const imageSize = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      const scale = Math.max(
        containerSize.width / imageSize.width,
        containerSize.height / imageSize.height,
      );

      childRef.current.style.backgroundImage = `url('${cover}')`;

      panZoomRef.current = initPanZoom(
        childRef.current,
        {
          ...props,
          boundary: true,
          className: props.className || 'react-panzoom-with-cover',
          width: imageSize.width,
          height: imageSize.height,
          zoomInitial: scale,
          zoomMin: scale,
          zoomMax: props.zoomMax * scale,
        },
      );

      if (apiRef && 'current' in apiRef) apiRef.current = panZoomRef.current;

      setInitialized(true);
      if (onCoverLoad) onCoverLoad();
    };

    const intervalId = setInterval(() => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        // naturalWidth and naturalHeight are all we need for scale calculations, so we can start
        // progressively rendering the image
        imageDimensionsKnownHandler();
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      if (!panZoomRef.current) return;
      panZoomRef.current.destroy();
      panZoomRef.current = null;
    };
  }, [cover]);

  return render;
};

const PanZoomWithCoverRef = forwardRef(
  (props: PanZoomWithCoverProps, ref: MutableRefObject<PanZoomApi>) => (
    <PanZoomWithCover {...props} apiRef={ref} />
  ),
) as React.FC<PanZoomWithCoverPropsRef>;

PanZoomWithCoverRef.displayName = 'PanZoomWithCover';

export default PanZoomWithCoverRef;
