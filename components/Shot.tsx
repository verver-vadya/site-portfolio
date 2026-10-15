import type { Img } from "@/lib/images";

// Скриншот работы: WebP нужной ширины из srcset, размеры прописаны, чтобы страница не прыгала
export function Shot({
  img,
  alt,
  sizes,
  className,
  priority = false,
  ...rest
}: {
  img: Img;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height">) {
  return (
    <img
      className={className}
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      {...rest}
    />
  );
}
