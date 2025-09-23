/**
 * 前端滑块验证码实现示例
 * 展示如何正确处理坐标转换和拖拽逻辑
 */

// 通用CSS属性类型
interface CSSProperties {
  [key: string]: any;
}

export interface CaptchaData {
  originalImageBase64: string;
  jigsawImageBase64: string;
  token: string;
  secretKey: string;
  coordinates?: {
    offsetX: number;
    offsetY: number;
    blockSize: number;
    originalWidth: number;
    originalHeight: number;
  };
  frontendTips?: {
    imageContainer: any;
    sliderImage: any;
    holeOverlay: any;
  };
}

export class CaptchaFrontend {
  private container: HTMLElement;
  private backgroundImage: HTMLImageElement;
  private sliderImage: HTMLImageElement;
  private slider: HTMLElement;
  private holeOverlay: HTMLElement;
  private captchaData: CaptchaData | null = null;
  private isDragging = false;
  private startX = 0;
  private currentX = 0;
  private track: number[] = [];
  private startTime = 0;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.initializeElements();
    this.bindEvents();
  }

  private initializeElements() {
    // 创建容器结构
    this.container.innerHTML = `
      <div class="captcha-container">
        <div class="image-container" style="position: relative; width: 310px; height: 155px; overflow: hidden;">
          <img class="background-image" style="width: 100%; height: 100%; object-fit: cover;" />
          <div class="hole-overlay" style="position: absolute; display: none;"></div>
          <div class="slider" style="position: absolute; cursor: move; user-select: none; z-index: 10;">
            <img class="slider-image" style="width: 50px; height: 50px; pointer-events: none;" />
          </div>
        </div>
        <div class="slider-track" style="width: 310px; height: 30px; background: #f0f0f0; margin-top: 10px; position: relative;">
          <div class="slider-button" style="width: 50px; height: 30px; background: #007bff; position: absolute; left: 0; cursor: move; border-radius: 15px;"></div>
        </div>
        <div class="captcha-info" style="margin-top: 10px; font-size: 14px; color: #666;">
          拖动滑块完成拼图验证
        </div>
      </div>
    `;

    // 获取元素引用
    this.backgroundImage = this.container.querySelector(
      ".background-image",
    ) as HTMLImageElement;
    this.sliderImage = this.container.querySelector(
      ".slider-image",
    ) as HTMLImageElement;
    this.slider = this.container.querySelector(".slider") as HTMLElement;
    this.holeOverlay = this.container.querySelector(
      ".hole-overlay",
    ) as HTMLElement;
  }

  private bindEvents() {
    const sliderButton = this.container.querySelector(
      ".slider-button",
    ) as HTMLElement;

    // 鼠标事件
    sliderButton.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // 触摸事件
    sliderButton.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
    );
    document.addEventListener("touchmove", this.handleTouchMove.bind(this));
    document.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  async loadCaptcha(captchaData: CaptchaData) {
    this.captchaData = captchaData;
    this.startTime = Date.now();
    this.track = [];
    this.currentX = 0;

    // 加载图片
    await Promise.all([
      this.loadImage(this.backgroundImage, captchaData.originalImageBase64),
      this.loadImage(this.sliderImage, captchaData.jigsawImageBase64),
    ]);

    // 重置滑块位置
    this.resetSlider();
  }

  private loadImage(img: HTMLImageElement, base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = base64;
    });
  }

  private resetSlider() {
    this.slider.style.left = "0px";
    this.slider.style.top = "0px";
    this.slider.style.display = "block";

    const sliderButton = this.container.querySelector(
      ".slider-button",
    ) as HTMLElement;
    sliderButton.style.left = "0px";

    this.holeOverlay.style.display = "none";
    this.currentX = 0;
  }

  private handleMouseDown(e: MouseEvent) {
    this.startDrag(e.clientX);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.updateDrag(e.clientX);
  }

  private handleMouseUp() {
    this.endDrag();
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    this.startDrag(e.touches[0].clientX);
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.updateDrag(e.touches[0].clientX);
  }

  private handleTouchEnd() {
    this.endDrag();
  }

  private startDrag(clientX: number) {
    this.isDragging = true;
    this.startX = clientX;
    this.track = [0];

    const sliderButton = this.container.querySelector(
      ".slider-button",
    ) as HTMLElement;
    sliderButton.style.background = "#0056b3";
  }

  private updateDrag(clientX: number) {
    if (!this.isDragging || !this.captchaData) return;

    const deltaX = clientX - this.startX;
    const trackWidth = 310; // 轨道宽度
    const sliderWidth = 50; // 滑块宽度

    // 限制拖动范围
    this.currentX = Math.max(0, Math.min(deltaX, trackWidth - sliderWidth));

    // 更新滑块位置
    const sliderButton = this.container.querySelector(
      ".slider-button",
    ) as HTMLElement;
    sliderButton.style.left = `${this.currentX}px`;

    // 更新拼图滑块位置
    const scale = 260 / trackWidth; // 图片宽度与轨道宽度的比例
    const puzzleX = this.currentX * scale;
    this.slider.style.left = `${puzzleX}px`;

    // 记录轨迹
    this.track.push(this.currentX);
  }

  private async endDrag() {
    if (!this.isDragging || !this.captchaData) return;

    this.isDragging = false;

    const sliderButton = this.container.querySelector(
      ".slider-button",
    ) as HTMLElement;
    sliderButton.style.background = "#007bff";

    // 验证
    await this.verifyCaptcha();
  }

  private async verifyCaptcha() {
    if (!this.captchaData) return;

    try {
      // 转换坐标
      const backendX = this.convertToBackendCoordinate(this.currentX);

      const response = await fetch("/common/verification/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: this.captchaData.token,
          secretKey: this.captchaData.secretKey,
          x: backendX,
          track: this.track,
          startTime: this.startTime,
        }),
      });

      const result = await response.json();

      if (result.code === 0) {
        // 验证成功
        this.showSuccess();
      } else {
        // 验证失败
        this.showError(result.message);
        setTimeout(() => this.resetSlider(), 1500);
      }
    } catch (error) {
      console.error("验证失败:", error);
      this.showError("网络错误");
      setTimeout(() => this.resetSlider(), 1500);
    }
  }

  private convertToBackendCoordinate(frontendX: number): number {
    // 前端轨道宽度：310px
    // 后端图片宽度：310px
    // 滑块宽度：50px
    const trackWidth = 310;
    const imageWidth = 310;

    // 计算比例
    const scale = imageWidth / trackWidth;

    // 转换为后端坐标
    return Math.round(frontendX * scale);
  }

  private showSuccess() {
    const info = this.container.querySelector(".captcha-info") as HTMLElement;
    info.textContent = "验证成功！";
    info.style.color = "#28a745";

    // 隐藏滑块
    this.slider.style.display = "none";
    this.holeOverlay.style.display = "none";
  }

  private showError(message: string) {
    const info = this.container.querySelector(".captcha-info") as HTMLElement;
    info.textContent = message;
    info.style.color = "#dc3545";
  }
}

// 使用示例
export function initializeCaptcha(containerId: string) {
  const captcha = new CaptchaFrontend(containerId);

  // 获取验证码
  fetch("/common/verification/captcha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.code === 0) {
        captcha.loadCaptcha(data.data);
      }
    })
    .catch((error) => {
      console.error("获取验证码失败:", error);
    });

  return captcha;
}
