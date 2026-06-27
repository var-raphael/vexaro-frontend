import DatasetsClient from "./DatasetsClient";

export default async function DatasetsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dataset-market`, {
    cache: "no-store",
  });
  const data = await res.json();

  return <DatasetsClient initialDatasets={data.datasets} />;
}