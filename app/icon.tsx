import Image from "next/image";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return (
    <Image
      src="/favicon.png"
      alt="Digits Packing Puzzle"
      width={size.width}
      height={size.height}
      priority
    />
  );
}
