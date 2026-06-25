// app/(app)/profile/[username]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { SITE_URL, SITE_NAME } from "@/lib/config";

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
    return { title: `Profile not found — ${SITE_NAME}` };
  }

  const { user } = data;

  return {
    title: `${user.username} — ${SITE_NAME}`,
    description:
      user.bio ||
      `${user.username}'s public datasets on ${SITE_NAME}. Browse, clone, and hit live data APIs.`,
    openGraph: {
      title: `${user.username} on ${SITE_NAME}`,
      description:
        user.bio || `Browse ${user.username}'s public datasets on ${SITE_NAME}.`,
      url: `${SITE_URL}/profile/${user.username}`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${user.username} on ${SITE_NAME}`,
      description:
        user.bio || `Browse ${user.username}'s public datasets on ${SITE_NAME}.`,
    },
    alternates: {
      canonical: `${SITE_URL}/profile/${user.username}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getProfile(username);

  if (!data) notFound();

  return <ProfileClient initialData={data} username={username} />;
}