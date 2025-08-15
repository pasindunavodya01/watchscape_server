import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Profile({ user }) {
  const { userId } = useParams(); // get userId from URL
  const [profile, setProfile] = useState(null);
  const [followed, setFollowed] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`https://spectacular-solace-watchscape.up.railway.app/api/users/${userId}/profile?viewerUid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFollowed(data.followedByViewer);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFollow = async () => {
    await fetch(`https://spectacular-solace-watchscape.up.railway.app/api/users/${userId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerUid: user.uid }),
    });
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{profile.user.name}</h1>
        {user.uid !== userId && (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={toggleFollow}
          >
            {followed ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      <div className="mb-4">
        <p>Followers: {profile.followersCount}</p>
        <p>Following: {profile.followingCount}</p>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Pinned Films</h2>
        <ul>
          {profile.pinnedFilms.map(f => (
            <li key={f.tmdbId}>{f.title}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Posts</h2>
        {profile.posts.map(p => (
          <div key={p._id} className="border p-2 mb-2 rounded bg-white">
            {p.text}
            <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
