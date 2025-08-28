function MovieActivityCard({ post, currentUid, onToggleLike, onAddComment, onToggleFollow, onShare }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);

  const liked = post.likes?.includes(currentUid);
  const comments = post.comments || [];
  const commentsSorted = useMemo(() => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [comments]);
  const latestComment = commentsSorted[0];
  
  // Fixed: Check for the action properly
  const actionText = post.movieActivity?.action === 'watchlist' 
    ? 'added to their watchlist' 
    : post.movieActivity?.action === 'watched'
    ? 'watched'
    : 'updated'; // fallback

  return (
    <div className="border bg-white rounded p-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/profile/${post.userId}`} className="text-blue-600 hover:underline font-semibold">
            {post.userName || post.username || post.userId}
          </Link>
          <span className="text-gray-600">{actionText}</span>
        </div>
        <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
      </div>

      {/* Movie info */}
      {post.movieActivity?.movie && (
        <div className="flex gap-3 mb-3">
          {post.movieActivity.movie.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w200${post.movieActivity.movie.posterPath}`}
              alt={post.movieActivity.movie.title}
              className="w-16 h-24 object-cover rounded cursor-pointer hover:opacity-80"
              onClick={() =>
                setSelectedPostMovie({
                  title: post.movieActivity.movie.title,
                  posterPath: post.movieActivity.movie.posterPath,
                  releaseDate: post.movieActivity.movie.releaseDate,
                  overview: post.movieActivity.movie.overview,
                })
              }
            />
          ) : (
            <div className="w-16 h-24 flex items-center justify-center bg-gray-100 text-gray-500 text-xs rounded">
              No Image
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold cursor-pointer hover:text-blue-600" 
                onClick={() =>
                  setSelectedPostMovie({
                    title: post.movieActivity.movie.title,
                    posterPath: post.movieActivity.movie.posterPath,
                    releaseDate: post.movieActivity.movie.releaseDate,
                    overview: post.movieActivity.movie.overview,
                  })
                }>
              {post.movieActivity.movie.title}
            </h3>
            {post.movieActivity.movie.releaseDate && (
              <p className="text-sm text-gray-600">
                {new Date(post.movieActivity.movie.releaseDate).getFullYear()}
              </p>
            )}
            {post.movieActivity.movie.overview && (
              <p className="text-sm mt-1 line-clamp-3">{post.movieActivity.movie.overview}</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        <button className="flex items-center gap-1" onClick={onToggleLike}>
          {liked ? <HeartSolid className="w-5 h-5 text-blue-600" /> : <HeartOutline className="w-5 h-5 text-gray-500" />}
          <span>({post.likes?.length || 0})</span>
        </button>
        <button className="hover:underline" onClick={() => setShowComments(s => !s)}>
          Comment ({post.comments?.length || 0})
        </button>
        <button className="hover:underline" onClick={onShare}>Share</button>
      </div>

      {/* Latest comment preview */}
      {latestComment && !showComments && (
        <>
          <div className="mt-2 text-sm">
            <Link to={`/dashboard/profile/${latestComment.userId}`} className="font-medium text-blue-600 hover:underline">
              {latestComment.userName}
            </Link>
            : {latestComment.text}
          </div>
          {comments.length > 1 && (
            <button className="text-xs text-blue-600 hover:underline mt-1" onClick={() => setShowComments(true)}>
              View all {comments.length} comments
            </button>
          )}
        </>
      )}

      {/* Full comments section */}
      {showComments && (
        <div className="mt-3 border-t pt-3">
          <div className="space-y-2 mb-3">
            {commentsSorted.map((c, idx) => (
              <div key={idx} className="text-sm">
                <Link to={`/dashboard/profile/${c.userId}`} className="font-medium text-blue-600 hover:underline">
                  {c.userName}
                </Link>
                : {c.text}
                <span className="text-xs text-gray-500 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddComment(commentText, () => setCommentText(''))}
            />
            <button 
              className="px-3 py-2 rounded bg-purple-700 text-white text-sm" 
              onClick={() => onAddComment(commentText, () => setCommentText(''))}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Movie details modal */}
      {selectedPostMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" onClick={() => setSelectedPostMovie(null)}>
          <div className="bg-white rounded max-w-lg w-full p-6 overflow-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{selectedPostMovie.title}</h2>
            {selectedPostMovie.posterPath && (
              <img 
                src={`https://image.tmdb.org/t/p/w300${selectedPostMovie.posterPath}`} 
                alt={selectedPostMovie.title} 
                className="mb-4 rounded mx-auto" 
              />
            )}
            {selectedPostMovie.releaseDate && (
              <p className="mb-2">
                <strong>Release Date:</strong> {selectedPostMovie.releaseDate}
              </p>
            )}
            {selectedPostMovie.overview && (
              <p className="text-gray-700">{selectedPostMovie.overview}</p>
            )}
            <div className="mt-6 text-right">
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" 
                onClick={() => setSelectedPostMovie(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}