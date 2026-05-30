// app/(app)/profile/[username]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

async function getProfile(username: string) {
  try {
    const res = await fetch(`http://localhost:8080/profile/${username}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfile(username);

  if (!data) {
    return { title: "Profile not found — Vexaro" };
  }

  const { user } = data;

  return {
    title: `${user.username} — Vexaro`,
    description:
      user.bio ||
      `${user.username}'s public datasets on Vexaro. Browse, clone, and hit live data APIs.`,
    openGraph: {
      title: `${user.username} on Vexaro`,
      description:
        user.bio || `Browse ${user.username}'s public datasets on Vexaro.`,
      url: `https://vexaro.com/profile/${user.username}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${user.username} on Vexaro`,
      description:
        user.bio || `Browse ${user.username}'s public datasets on Vexaro.`,
    },
    alternates: {
      canonical: `https://vexaro.com/profile/${user.username}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getProfile(username);

  if (!data) notFound();

  return <ProfileClient initialData={data} username={username} />;
}