import { unstable_cache } from "next/cache";

export const unstable_cache_wrapper = <T, A>(
  call: (...args: A[]) => Promise<T>,
  tag: string,
) => {
  return unstable_cache(call, [tag], { tags: [tag] });
};
