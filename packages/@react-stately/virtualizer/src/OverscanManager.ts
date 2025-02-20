/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Point} from './Point';
import {Rect} from './Rect';

export class OverscanManager {
  private startTime = 0;
  private velocity = new Point(0, 0);
  private visibleRect = new Rect();

  setVisibleRect(rect: Rect): void {
    let time = performance.now() - this.startTime;
    if (time < 500) {
      if (rect.x !== this.visibleRect.x && time > 0) {
        this.velocity.x = (rect.x - this.visibleRect.x) / time;
      }

      if (rect.y !== this.visibleRect.y && time > 0) {
        this.velocity.y = (rect.y - this.visibleRect.y) / time;
      }
    }

    this.startTime = performance.now();
    this.visibleRect = rect;
  }

  getOverscannedRect(): Rect {
    let overscanned = this.visibleRect.copy();

    let overscanY = this.visibleRect.height / 3;
    overscanned.height += overscanY;
    if (this.velocity.y < 0) {
      overscanned.y -= overscanY;
    }

    if (this.velocity.x !== 0) {
      let overscanX = this.visibleRect.width / 3;
      overscanned.width += overscanX;
      if (this.velocity.x < 0) {
        overscanned.x -= overscanX;
      }
    }

    return overscanned;
  }
}
