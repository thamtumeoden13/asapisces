// File: components/companion/LiveTranscript.tsx

interface LiveTranscriptProps {
  /** Dòng thoại hiện tại cần hiển thị */
  text: string;
  /** Cho biết đây có phải là lượt của người dùng hay không */
  isUserTurn: boolean;
}

export const LiveTranscript = ({ text, isUserTurn }: LiveTranscriptProps) => {
  return (
    <div className="text-center">
      {/* Hiển thị gợi ý cho người dùng */}
      {isUserTurn && (
        <span className="mb-2 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-300 animate-pulse">
          🎯 Your turn!
        </span>
      )}

      {/* Hiển thị dòng thoại chính */}
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-white">
        {text}
      </p>
    </div>
  );
};
