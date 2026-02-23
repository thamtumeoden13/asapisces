// File: lib/AudioPlayer.ts (PHIÊN BẢN HOÀN THIỆN)

class PlayerService {
  private player: HTMLAudioElement;
  private currentPromise: {
    resolve: () => void;
    reject: (reason?: any) => void;
  } | null = null;
  private currentAudioUrl: string | null = null;

  // Listeners cần được dọn dẹp
  private onEndedListener = () => this.handleEnded();
  private onErrorListener = (e: Event) => this.handleError(e);
  private onCanPlayListener = () => this.handleCanPlay();
  // MỚI: Listeners để theo dõi trạng thái buffering
  private onWaitingListener = () => console.log("AudioPlayer: Buffering... Waiting for more data.");
  private onPlayingListener = () => console.log("AudioPlayer: Resumed playback after buffering.");
  private onStalledListener = () => console.warn("AudioPlayer: Media data transfer stalled.");


  constructor() {
    if (typeof window !== "undefined") {
      this.player = new Audio();
    } else {
      this.player = {} as HTMLAudioElement;
    }
  }

  private cleanupListeners() {
    this.player.removeEventListener('ended', this.onEndedListener);
    this.player.removeEventListener('error', this.onErrorListener);
    this.player.removeEventListener('canplay', this.onCanPlayListener);
    // MỚI: Dọn dẹp listeners buffering
    this.player.removeEventListener('waiting', this.onWaitingListener);
    this.player.removeEventListener('playing', this.onPlayingListener);
    this.player.removeEventListener('stalled', this.onStalledListener);
  }

  private handleEnded() {
    console.log("AudioPlayer: Playback finished successfully.");
    if (this.currentPromise) {
      this.currentPromise.resolve();
    }
    this.resetState();
  }

  private handleError(e: Event) {
    const error = this.player.error;
    console.error("AudioPlayer: An error occurred during playback.", {
        code: error?.code,
        message: error?.message,
        event: e
    });
    if (this.currentPromise) {
      this.currentPromise.reject(error || new Error("Audio playback failed."));
    }
    this.resetState();
  }
  
  private handleCanPlay() {
     console.log("AudioPlayer: Audio is ready to play, attempting to start.");
     this.player.play().catch(playError => {
        console.error("AudioPlayer: play() command was rejected.", playError);
        if (this.currentPromise) {
            this.currentPromise.reject(playError);
        }
        this.resetState();
     });
  }

  private resetState() {
    this.cleanupListeners();
    this.currentPromise = null;
    this.currentAudioUrl = null;
    
    if (this.player && this.player.src) {
      // Dừng hẳn việc tải và giải phóng bộ nhớ
      this.player.src = "";
      this.player.removeAttribute("src"); // Quan trọng để đảm bảo trình duyệt không giữ lại tham chiếu
      this.player.load();
    }
  }

  play(audioUrl: string): Promise<void> {
    console.log(`AudioPlayer: Play request for URL: ${audioUrl}`);

    if (this.currentPromise) {
      console.warn("AudioPlayer: Interrupting previous playback for a new request.");
      this.stop(new Error("Playback interrupted by a new request.")); 
    }
    
    return new Promise((resolve, reject) => {
      this.currentPromise = { resolve, reject };
      this.currentAudioUrl = audioUrl;
      
      this.cleanupListeners();
      
      this.player.addEventListener('ended', this.onEndedListener);
      this.player.addEventListener('error', this.onErrorListener);
      this.player.addEventListener('canplay', this.onCanPlayListener);
      // MỚI: Thêm listeners để theo dõi buffering
      this.player.addEventListener('waiting', this.onWaitingListener);
      this.player.addEventListener('playing', this.onPlayingListener);
      this.player.addEventListener('stalled', this.onStalledListener);

      this.player.src = audioUrl;
      this.player.load();
    });
  }

  stop(reason: Error = new Error("Playback stopped by user.")) {
    console.log(`AudioPlayer: Stop requested. Reason: ${reason.message}`);
    
    if (this.player && !this.player.paused) {
      this.player.pause();
    }
    
    if (this.currentPromise) {
      this.currentPromise.reject(reason);
    }

    this.resetState();
  }
}

export const audioPlayer = new PlayerService();