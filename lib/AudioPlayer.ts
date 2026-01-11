// File: lib/AudioPlayer.ts

class PlayerService {
  private player: HTMLAudioElement;
  private currentPromise: {
    resolve: () => void;
    reject: (reason?: any) => void;
  } | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.player = new Audio();

      this.player.onended = () => {
        // Chỉ resolve nếu có một promise đang chờ
        if (this.currentPromise) {
          console.log("AudioPlayer: Playback ended naturally.");
          this.currentPromise.resolve();
          this.currentPromise = null; // Dọn dẹp
        }
      };

      this.player.onerror = () => {
        // Chỉ reject nếu có một promise đang chờ
        if (this.currentPromise) {
          console.error("AudioPlayer: Playback error.");
          this.currentPromise.reject(new Error("Audio playback failed."));
          this.currentPromise = null; // Dọn dẹp
        }
      };
    } else {
      this.player = {} as HTMLAudioElement;
    }
  }

  play(audioUrl: string): Promise<void> {
    console.log("AudioPlayer: Play request for URL:", audioUrl);

    // --- LOGIC MỚI: HỦY BỎ PROMISE CŨ ---
    // Nếu có một audio đang phát hoặc đang tải, hủy nó trước
    if (this.currentPromise) {
      console.warn("AudioPlayer: Interrupting previous playback.");
      this.stop(); // Dừng audio hiện tại
      this.currentPromise.reject(new Error("Playback interrupted by a new request."));
      this.currentPromise = null;
    }

    return new Promise((resolve, reject) => {
      // Lưu lại resolve và reject của Promise mới
      this.currentPromise = { resolve, reject };

      const onCanPlay = () => {
        this.player.play().catch((playError) => {
          console.error("AudioPlayer: play() was rejected.", playError);
          // Gỡ bỏ listener để tránh memory leak
          this.player.removeEventListener('canplaythrough', onCanPlay);
          this.currentPromise?.reject(playError);
          this.currentPromise = null;
        });
      };
      
      // Gán listener mới
      this.player.addEventListener('canplaythrough', onCanPlay, { once: true });

      // Gán src và bắt đầu tải
      this.player.src = audioUrl;
      this.player.load();
    });
  }

  stop() {
    console.log("AudioPlayer: Stop requested.");
    
    // Ngắt Promise đang chờ (nếu có)
    if (this.currentPromise) {
      // Reject Promise với một lý do cụ thể để bên ngoài biết nó đã bị hủy
      this.currentPromise.reject(new Error("Playback stopped by user."));
      this.currentPromise = null;
    }

    // Dừng audio player
    if (this.player && !this.player.paused) {
      this.player.pause();
      this.player.currentTime = 0;
    }
    // Đảm bảo src được xóa để ngăn việc tải tiếp
    this.player.src = ""; 
  }
}

export const audioPlayer = new PlayerService();