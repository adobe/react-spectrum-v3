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

export class Size {
  width: number;
  height: number;

  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }

  /**
   * Returns a copy of this size.
   */
  copy(): Size {
    return new Size(this.width, this.height);
  }

  /**
   * Returns whether this size is equal to another one.
   */
  equals(other: Size): boolean {
    return this.width === other.width
        && this.height === other.height;
  }

  /**
   * The total area of the Size.
   */
  get area(): number {
    return this.width * this.height;
  }
}
