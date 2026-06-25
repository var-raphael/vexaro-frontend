export default function Body() {
  return (
    <>
      <p>
        When you scrape a page and store the result, the default behavior in almost every pipeline is to overwrite what was there before. Last fetch wins. Everything prior is gone.
      </p>
      <p>
        That feels fine until it isn't. A source site changes its layout and your extractor starts returning garbage. A field you depend on disappears. An entry gets removed from the source. And because you overwrote the previous data, you have no way to go back, no way to diff what changed, and no way to know when it happened.
      </p>
      <p>
        Vexaro treats every refresh as an immutable snapshot. Version 1 is always version 1. Version 12 doesn't replace version 11 — it sits alongside it. You can query any version by number, roll back the active pointer to any prior state in one click, and diff any two versions to see exactly what changed: which entities were added, which were removed, and which fields were modified.
      </p>
      <p>
        This matters more than it sounds. It means your API consumers get stability — active only moves when you decide it moves. It means you can catch a bad refresh before it propagates. And it means you have a permanent audit trail of how a source has changed over time, which turns out to be genuinely useful data in itself.
      </p>
      <p>
        Nothing is ever overwritten. That's a design choice, not a default.
      </p>
    </>
  );
}