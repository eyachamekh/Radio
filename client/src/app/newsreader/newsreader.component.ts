import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HttpClient } from '@angular/common/http';

interface NewsItem {
  text: string;
  category: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

@Component({
  selector: 'app-newsreader',
  templateUrl: './newsreader.component.html',
  styleUrls: ['./newsreader.component.scss']
})
export class NewsreaderComponent implements AfterViewInit, OnDestroy {
  newsItems: NewsItem[] = [];
  speaking: boolean = false;

  // three.js
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationFrameId = 0;

  // media
  private mediaMesh: THREE.Mesh | null = null;

  // morphs
  private skinnedMeshes: THREE.SkinnedMesh[] = [];
  private currentAvatarUrl = 'assets/womenn.glb';
  private currentAvatar: THREE.Object3D | null = null;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    const nav = history.state;
    if (nav && nav.processedNews && nav.processedNews.categories) {
      this.flattenProcessedNews(nav.processedNews.categories);
    }
    this.initThree();
    this.loadAvatar(this.currentAvatarUrl); // ✅ pass default avatar
  }

  ngOnDestroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) this.renderer.dispose();
  }

  private flattenProcessedNews(categories: { [key: string]: string[] }) {
    this.newsItems = [];
    for (const [category, sentences] of Object.entries(categories)) {
      for (const sentence of sentences) {
        this.newsItems.push({ text: sentence, category });
      }
    }
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    const container = document.getElementById('avatar-container')!;
    const width = Math.max(300, container.clientWidth);
    const height = Math.max(200, container.clientHeight);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 5, 5);
    this.scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambLight);

    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  // ✅ Clean version
  private loadAvatar(url: string) {
    const loader = new GLTFLoader();

    if (this.currentAvatar) {
      this.scene.remove(this.currentAvatar);
      this.currentAvatar = null;
      this.skinnedMeshes = [];
    }

    loader.load(
      url,
      (gltf) => {
        gltf.scene.scale.set(1.5, 1.5, 1.5);
        this.scene.add(gltf.scene);
        this.currentAvatar = gltf.scene;

        this.skinnedMeshes = [];
        gltf.scene.traverse((child: any) => {
          if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
            this.skinnedMeshes.push(child as THREE.SkinnedMesh);
            console.log(`✅ Found morph targets on ${child.name}:`, child.morphTargetDictionary);
          }
        });
      },
      undefined,
      (err) => console.error('❌ Error loading GLB:', err)
    );
  }

  // ✅ Avatar change handler
  onAvatarChange(event: Event) {
    const newUrl = (event.target as HTMLSelectElement).value;
    this.currentAvatarUrl = newUrl;
    this.loadAvatar(newUrl);
  }

  // ---------------- media handling (image/video) ----------------
  onMediaSelected(event: any, item: NewsItem) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    item.mediaUrl = url;
    item.mediaType = file.type.startsWith('video') ? 'video' : 'image';

    // show immediately for preview
    if (item.mediaType === 'video') this.showVideo(url);
    else this.showImage(url);
  }

  private showImage(url: string) {
    if (!this.scene) return;
    this.hideMedia();

    const geometry = new THREE.PlaneGeometry(1.8, 1.2);
    const loader = new THREE.TextureLoader();
    loader.load(url, (texture) => {
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      this.mediaMesh = new THREE.Mesh(geometry, mat);
      this.mediaMesh.position.set(2.5, 1.4, 0);
      this.mediaMesh.rotation.y = 0; // flat
      this.scene.add(this.mediaMesh);
    });
  }

  private showVideo(url: string) {
    if (!this.scene) return;
    this.hideMedia();

    const geometry = new THREE.PlaneGeometry(1.8, 1.2);
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true; // allows autoplay
    video.playsInline = true;

    const onCan = () => {
      video.removeEventListener('canplay', onCan);

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      videoTexture.needsUpdate = true;

      const mat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
      this.mediaMesh = new THREE.Mesh(geometry, mat);
      this.mediaMesh.position.set(2.5, 1.4, 0);
      this.mediaMesh.rotation.y = 0;
      this.scene.add(this.mediaMesh);

      video.play().catch((e) => console.warn('Video play blocked:', e));
    };

    video.addEventListener('canplay', onCan);
    video.load();
  }

  private hideMedia() {
    if (!this.scene || !this.mediaMesh) return;
    this.scene.remove(this.mediaMesh);

    const mat = this.mediaMesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat.dispose();
    this.mediaMesh.geometry.dispose();
    this.mediaMesh = null;
  }

  // ----------------- morph helpers -----------------
  private setMouthValue(value: number) {
    if (!this.skinnedMeshes.length) return;
    const v = Math.max(0, Math.min(1, value));

    this.skinnedMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      if (!dict) return;

      let index = dict['mouthOpen'];
      if (index === undefined) {
        const keys = Object.keys(dict);
        if (keys.length > 0) index = dict[keys[0]];
      }

      if (index !== undefined && mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[index] = v;
      }
    });
  }

  private setSmileValue(value: number) {
    if (!this.skinnedMeshes.length) return;
    const v = Math.max(0, Math.min(1, value));

    this.skinnedMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      if (!dict) return;

      let index = dict['mouthSmile'];
      if (index === undefined) return; // skip if no smile morph
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[index] = v;
      }
    });
  }

  // small debug/test function - toggles mouth once (open -> close)
  public testMouthOnce() {
    if (!this.skinnedMeshes.length) {
      console.warn('No mouth morphs available.');
      return;
    }
    this.setMouthValue(1);
    setTimeout(() => this.setMouthValue(0), 400);
  }

  // ---------------- TTS / lip-sync ----------------
  readNews(item: NewsItem) {
    if (!item) return;
    const text = `${item.category}: ${item.text}`;

    // show media if any
    if (item.mediaUrl) {
      if (item.mediaType === 'video') this.showVideo(item.mediaUrl);
      else this.showImage(item.mediaUrl);
    } else {
      this.hideMedia();
    }

    this.http.post<{ audioUrl: string; visemes?: any[] }>('http://localhost:3000/api/news/tts', { text })
      .subscribe(
        (resp) => {
          this.playAudioWithVisemes(resp.audioUrl, resp.visemes || [], () => this.hideMedia());
        },
        (err) => {
          console.error('TTS error', err);
        }
      );
  }

  async readAllNews() {
    for (const item of this.newsItems) {
      if (item.mediaUrl) {
        if (item.mediaType === 'video') this.showVideo(item.mediaUrl);
        else this.showImage(item.mediaUrl);
      } else {
        this.hideMedia();
      }

      const text = `${item.category}: ${item.text}`;
      await this.playText(text, 0.8); // early start next
      this.hideMedia();
    }
  }

  private playText(text: string, earlyEndFraction = 1.0): Promise<void> {
    return new Promise((resolve) => {
      this.http.post<{ audioUrl: string; visemes?: any[] }>('http://localhost:3000/api/news/tts', { text })
        .subscribe(
          (resp) => {
            this.playAudioWithVisemes(resp.audioUrl, resp.visemes || [], resolve, earlyEndFraction);
          },
          (err) => {
            console.error('TTS fetch error', err);
            resolve();
          }
        );
    });
  }

 private playAudioWithVisemes(
  audioUrl: string,
  visemes: any[],
  onComplete?: () => void,
  earlyEndFraction = 1.0
) {
  const audio = new Audio(audioUrl);
  let resolved = false;

  audio.onplay = () => {
    this.speaking = true;
    this.setSmileValue(0); // stop smiling when talking
  };

  audio.onended = () => {
    this.speaking = false;
    this.setMouthValue(0);
    this.setSmileValue(1); // back to smile when idle
    if (!resolved) {
      resolved = true;
      if (onComplete) onComplete();
    }
  };

  // Animate with visemes if present
  if (Array.isArray(visemes) && visemes.length > 0) {
    const startTime = Date.now();
    const step = () => {
      if (audio.paused) return;
      const elapsed = (Date.now() - startTime) / 1000;

      let mouthVal = 0;
      for (const v of visemes) {
        if (typeof v.start === 'number' && typeof v.end === 'number') {
          if (elapsed >= v.start && elapsed <= v.end) {
            mouthVal = 1.0;
            break;
          }
        }
      }
      this.setMouthValue(mouthVal);

      if (
        !resolved &&
        audio.duration &&
        earlyEndFraction < 1 &&
        audio.currentTime >= audio.duration * earlyEndFraction
      ) {
        resolved = true;
        if (onComplete) onComplete();
      }

      requestAnimationFrame(step);
    };
    audio.play().catch(e => console.warn('Audio play blocked', e));
    requestAnimationFrame(step);
  } else {
    // fallback rhythmic open/close
    audio.play().catch(e => console.warn('Audio play blocked', e));
    let open = false;
    const toggle = () => {
      if (audio.paused) {
        this.setMouthValue(0);
        return;
      }
      open = !open;
      this.setMouthValue(open ? 1.0 : 0.0);

      if (
        !resolved &&
        audio.duration &&
        earlyEndFraction < 1 &&
        audio.currentTime >= audio.duration * earlyEndFraction
      ) {
        resolved = true;
        if (onComplete) onComplete();
      }

      setTimeout(() => requestAnimationFrame(toggle), 120);
    };
    requestAnimationFrame(toggle);
  }
}
}