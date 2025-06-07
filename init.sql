DROP TABLE IF EXISTS posts;
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content TEXT
);

INSERT INTO posts (id, title, content) VALUES
(1, '初めての投稿', 'これは私の最初のブログ投稿です。'),
(2, '2番目の投稿', 'ブログを続けるのは楽しいです。'),
(3, '今日の出来事', '今日は晴れでした。');
