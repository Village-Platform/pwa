import { useOnVisible } from "../lib/hooks";
import { ErrorBanner, MessageBox, SkeletonRows } from "./ui.jsx";

/**
 * The body of an infinite-scroll list: rows, skeletons while loading, the error with a retry, the
 * empty message, and the sentinel that loads the next page when it scrolls into view.
 *
 *   const list = usePaged((page) => Api.firms({ page }), []);
 *   <PagedList list={list} empty={S.noFirms} renderItem={(f) => <FirmRow key={f.id} firm={f} />} />
 *
 * `items` overrides list.items (e.g. a client-side filter); the empty message follows it.
 * `skeletons` is how many placeholder rows to show: [first load, loading more].
 * `empty` may be a string or a node.
 */
export default function PagedList({
  list,
  items = list.items,
  renderItem,
  empty,
  skeletons = [5, 2],
  className = "px-4 space-y-2",
}) {
  const sentinel = useOnVisible(() => list.loadMore());
  return (
    <>
      <div className={className}>{items.map(renderItem)}</div>
      {list.loading && <SkeletonRows count={list.items.length ? skeletons[1] : skeletons[0]} />}
      <ErrorBanner error={list.error} onRetry={list.retry} />
      {!list.loading &&
        !list.error &&
        items.length === 0 &&
        (typeof empty === "string" ? <MessageBox text={empty} /> : empty)}
      <div ref={sentinel} className="h-1" />
    </>
  );
}
