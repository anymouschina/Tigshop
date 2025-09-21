/**
 * 滑块验证码坐标转换工具
 * 用于前端显示坐标与后端验证坐标的转换
 */

// 通用CSS属性类型
interface CSSProperties {
  [key: string]: any;
}

export interface CaptchaCoordinates {
  offsetX: number;  // 后端生成的X坐标
  offsetY: number;  // 后端生成的Y坐标
  blockSize: number; // 滑块大小
}

export interface DisplayCoordinates {
  displayX: number;  // 前端显示的X坐标
  displayY: number;  // 前端显示的Y坐标
  displayWidth: number;  // 前端显示宽度
  displayHeight: number; // 前端显示高度
}

export class CaptchaCoordinateConverter {
  /**
   * 计算前端显示坐标
   * @param backendCoords 后端坐标
   * @param displaySize 前端显示尺寸
   * @returns 前端显示坐标
   */
  static calculateDisplayCoordinates(
    backendCoords: CaptchaCoordinates,
    displaySize: { width: number; height: number }
  ): DisplayCoordinates {
    const { offsetX, offsetY, blockSize } = backendCoords;
    const { width, height } = displaySize;

    // 后端原始尺寸
    const originalWidth = 310;
    const originalHeight = 155;

    // 计算缩放比例
    const scaleX = width / originalWidth;
    const scaleY = height / originalHeight;

    return {
      displayX: offsetX * scaleX,
      displayY: offsetY * scaleY,
      displayWidth: blockSize * scaleX,
      displayHeight: blockSize * scaleY
    };
  }

  /**
   * 将前端拖拽位置转换为后端验证坐标
   * @param dragX 前端拖拽的X坐标
   * @param displaySize 前端显示尺寸
   * @returns 后端验证的X坐标
   */
  static convertToBackendCoordinate(
    dragX: number,
    displaySize: { width: number; height: number }
  ): number {
    const originalWidth = 310;
    const scaleX = displaySize.width / originalWidth;

    // 将前端坐标转换为后端坐标
    return Math.round(dragX / scaleX);
  }

  /**
   * 验证滑块位置是否在容差范围内
   * @param dragX 前端拖拽的X坐标
   * @param backendCoords 后端坐标
   * @param displaySize 前端显示尺寸
   * @param tolerance 容差值（默认为3，与后端一致）
   * @returns 是否验证通过
   */
  static verifyPosition(
    dragX: number,
    backendCoords: CaptchaCoordinates,
    displaySize: { width: number; height: number },
    tolerance: number = 3
  ): boolean {
    const backendX = this.convertToBackendCoordinate(dragX, displaySize);
    const distance = Math.abs(backendX - backendCoords.offsetX);

    return distance <= tolerance;
  }

  /**
   * 计算滑块应该显示的位置
   * @param backendCoords 后端坐标
   * @param displaySize 前端显示尺寸
   * @returns 滑块的CSS样式
   */
  static calculateSliderStyle(
    backendCoords: CaptchaCoordinates,
    displaySize: { width: number; height: number }
  ): CSSProperties {
    const displayCoords = this.calculateDisplayCoordinates(backendCoords, displaySize);

    return {
      position: 'absolute' as const,
      left: `${displayCoords.displayX}px`,
      top: `${displayCoords.displayY}px`,
      width: `${displayCoords.displayWidth}px`,
      height: `${displayCoords.displayHeight}px`,
      cursor: 'move',
      userSelect: 'none' as const,
      zIndex: 10,
    };
  }

  /**
   * 计算缺口（挖空）位置的样式
   * @param backendCoords 后端坐标
   * @param displaySize 前端显示尺寸
   * @returns 缺口的CSS样式
   */
  static calculateHoleStyle(
    backendCoords: CaptchaCoordinates,
    displaySize: { width: number; height: number }
  ): CSSProperties {
    const displayCoords = this.calculateDisplayCoordinates(backendCoords, displaySize);

    return {
      position: 'absolute' as const,
      left: `${displayCoords.displayX}px`,
      top: `${displayCoords.displayY}px`,
      width: `${displayCoords.displayWidth}px`,
      height: `${displayCoords.displayHeight}px`,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      border: '2px solid rgba(0, 0, 0, 0.5)',
      borderRadius: '4px',
      zIndex: 5,
    };
  }

  /**
   * 获取拖拽轨迹数据
   * @param startTime 开始时间
   * @returns 轨迹数据和时间戳
   */
  static generateTrackData(startTime?: number): {
    track: number[];
    startTime: number;
  } {
    const now = Date.now();
    const startTimeValue = startTime || now;

    // 生成模拟的拖拽轨迹（实际使用中应该从鼠标移动事件中获取）
    const track = [];
    const steps = Math.floor(Math.random() * 10) + 5; // 5-15个步骤

    for (let i = 0; i < steps; i++) {
      // 添加一些随机性来模拟真实的人类拖拽
      const baseValue = (i / steps) * 100;
      const randomVariation = (Math.random() - 0.5) * 10;
      track.push(Math.max(0, baseValue + randomVariation));
    }

    return {
      track,
      startTime: startTimeValue
    };
  }
}