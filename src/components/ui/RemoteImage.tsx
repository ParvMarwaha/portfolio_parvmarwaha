import { forwardRef } from "react";

// Plain <img>: the project images are linked from Behance's own CDN rather than copied into the repo.
const RemoteImage = forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(function RemoteImage(props, ref) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} {...props} alt={props.alt ?? ""} decoding="async" draggable={false} />;
});

export default RemoteImage;
