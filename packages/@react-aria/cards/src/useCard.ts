/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaCardProps} from '@react-types/cards';
import {filterDOMProps, useSlotId} from '@react-aria/utils';
import {HTMLAttributes, useMemo} from 'react';

interface AriaCardOptions extends AriaCardProps {
}

interface CardAria {
  cardProps: HTMLAttributes<HTMLDivElement>,
  titleProps: HTMLAttributes<HTMLDivElement>,
  contentProps: HTMLAttributes<HTMLDivElement>
}

/**
 * TODO: Add description of aria hook here.
 * @param props - Props for the Card.
 */
export function useCard(props: AriaCardOptions): CardAria {
  let titleId = useSlotId();
  let descriptionId = useSlotId();
  let titleProps = useMemo(() => ({
    id: titleId
  }), [titleId]);
  let contentProps = useMemo(() => ({
    id: descriptionId
  }), [descriptionId]);

  return {
    cardProps: {
      ...filterDOMProps(props),
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      tabIndex: 0
    },
    titleProps,
    contentProps
  };
}
