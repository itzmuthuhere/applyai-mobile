import feedReducer, {
  setPosts, appendPosts, prependPost, removePost,
  setReaction, incrementComments, updatePost,
  FeedPost,
} from '../store/slices/feedSlice';

const makePost = (id: number): FeedPost => ({
  id, content: `Post ${id}`, likesCount: 0, commentsCount: 0,
  createdAt: '2026-06-27T10:00:00', myReaction: null,
  author: { id: 1, name: 'Alice' },
});

const initial = { posts: [], page: 1, hasMore: true, loading: false };

describe('setPosts', () => {
  it('replaces posts and sets page=1 so next loadMore requests page 1 not page 0', () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));
    const state = feedReducer(initial, setPosts(posts));
    expect(state.posts).toHaveLength(20);
    expect(state.page).toBe(1);
  });

  it('sets hasMore=true when exactly 20 items returned', () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));
    const state = feedReducer(initial, setPosts(posts));
    expect(state.hasMore).toBe(true);
  });

  it('sets hasMore=false when fewer than 20 items returned', () => {
    const state = feedReducer(initial, setPosts([makePost(1), makePost(2)]));
    expect(state.hasMore).toBe(false);
  });

  it('sets hasMore=false and page=1 on empty list', () => {
    const state = feedReducer(initial, setPosts([]));
    expect(state.posts).toHaveLength(0);
    expect(state.page).toBe(1);
    expect(state.hasMore).toBe(false);
  });
});

describe('appendPosts', () => {
  it('appends new posts and increments page', () => {
    const base = { ...initial, posts: [makePost(1)], page: 1 };
    const state = feedReducer(base, appendPosts([makePost(2), makePost(3)]));
    expect(state.posts).toHaveLength(3);
    expect(state.page).toBe(2);
  });

  it('deduplicates posts that are already in the list', () => {
    const base = { ...initial, posts: [makePost(1), makePost(2)] };
    const state = feedReducer(base, appendPosts([makePost(2), makePost(3)]));
    expect(state.posts).toHaveLength(3);
    expect(state.posts.map(p => p.id)).toEqual([1, 2, 3]);
  });

  it('sets hasMore=false when fewer than 20 items returned', () => {
    const base = { ...initial, posts: [makePost(1)] };
    const state = feedReducer(base, appendPosts([makePost(2)]));
    expect(state.hasMore).toBe(false);
  });
});

describe('prependPost', () => {
  it('inserts new post at the top', () => {
    const base = { ...initial, posts: [makePost(2), makePost(3)] };
    const state = feedReducer(base, prependPost(makePost(1)));
    expect(state.posts[0].id).toBe(1);
    expect(state.posts).toHaveLength(3);
  });
});

describe('removePost', () => {
  it('removes post by id', () => {
    const base = { ...initial, posts: [makePost(1), makePost(2), makePost(3)] };
    const state = feedReducer(base, removePost(2));
    expect(state.posts.map(p => p.id)).toEqual([1, 3]);
  });

  it('is a no-op for unknown id', () => {
    const base = { ...initial, posts: [makePost(1)] };
    const state = feedReducer(base, removePost(999));
    expect(state.posts).toHaveLength(1);
  });
});

describe('setReaction', () => {
  it('updates reaction and likesCount on matching post', () => {
    const post = { ...makePost(1), likesCount: 3, myReaction: null };
    const base = { ...initial, posts: [post] };
    const state = feedReducer(base, setReaction({ postId: 1, reaction: 'LIKE', likesCount: 4 }));
    expect(state.posts[0].myReaction).toBe('LIKE');
    expect(state.posts[0].likesCount).toBe(4);
  });

  it('is a no-op for unknown postId', () => {
    const base = { ...initial, posts: [makePost(1)] };
    const state = feedReducer(base, setReaction({ postId: 999, reaction: 'LIKE', likesCount: 1 }));
    expect(state.posts[0].myReaction).toBeNull();
  });
});

describe('updatePost', () => {
  it('replaces post in-place by id', () => {
    const base = { ...initial, posts: [makePost(1), makePost(2)] };
    const edited = { ...makePost(1), content: 'Edited!' };
    const state = feedReducer(base, updatePost(edited));
    expect(state.posts[0].content).toBe('Edited!');
    expect(state.posts[1].id).toBe(2);
  });

  it('is a no-op for unknown id', () => {
    const base = { ...initial, posts: [makePost(1)] };
    const state = feedReducer(base, updatePost(makePost(999)));
    expect(state.posts).toHaveLength(1);
  });
});

describe('incrementComments', () => {
  it('increments commentsCount on matching post', () => {
    const base = { ...initial, posts: [{ ...makePost(1), commentsCount: 2 }] };
    const state = feedReducer(base, incrementComments(1));
    expect(state.posts[0].commentsCount).toBe(3);
  });
});
