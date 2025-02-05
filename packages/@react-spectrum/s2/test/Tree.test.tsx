
import {AriaTreeTests} from '../../../react-aria-components/test/AriaTree.test-util';
import FileTxt from '../s2wf-icons/S2_Icon_FileText_20_N.svg';
import Folder from '../s2wf-icons/S2_Icon_Folder_20_N.svg';
import React from 'react';
import {render} from '@react-spectrum/test-utils-internal';
import {
  Text,
  TreeItemContent,
  TreeView,
  TreeViewItem
} from '../src';

AriaTreeTests({
  prefix: 'spectrum2-static',
  setup: () => {
    let offsetWidth, offsetHeight;

    beforeAll(function () {
      offsetWidth = jest.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 1000);
      offsetHeight = jest.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 1000);
    });

    afterAll(function () {
      offsetWidth.mockReset();
      offsetHeight.mockReset();
    });
  },
  renderers: {
    // todo - we don't support isDisabled on TreeViewItems?
    standard: () => render(
      <TreeView aria-label="test tree">
        <TreeViewItem id="Photos" textValue="Photos">
          <TreeItemContent>
            <Text>Photos</Text>
            <Folder />
          </TreeItemContent>
        </TreeViewItem>
        <TreeViewItem id="projects" textValue="Projects">
          <TreeItemContent>
            <Text>Projects</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="projects-1" textValue="Projects-1">
            <TreeItemContent>
              <Text>Projects-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="projects-1A" textValue="Projects-1A">
              <TreeItemContent>
                <Text>Projects-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="projects-2" textValue="Projects-2">
            <TreeItemContent>
              <Text>Projects-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="projects-3" textValue="Projects-3">
            <TreeItemContent>
              <Text>Projects-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
        <TreeViewItem id="school" textValue="school">
          <TreeItemContent>
            <Text>School</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="homework-1" textValue="homework-1">
            <TreeItemContent>
              <Text>Homework-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="homework-1A" textValue="homework-1A">
              <TreeItemContent>
                <Text>Homework-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="homework-2" textValue="homework-2">
            <TreeItemContent>
              <Text>Homework-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="homework-3" textValue="homework-3">
            <TreeItemContent>
              <Text>Homework-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
    ),
    singleSelection: () => render(
      <TreeView aria-label="test tree" selectionMode="single" disabledKeys={['school']} disabledBehavior="selection">
        <TreeViewItem id="Photos" textValue="Photos">
          <TreeItemContent>
            <Text>Photos</Text>
            <Folder />
          </TreeItemContent>
        </TreeViewItem>
        <TreeViewItem id="projects" textValue="Projects">
          <TreeItemContent>
            <Text>Projects</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="projects-1" textValue="Projects-1">
            <TreeItemContent>
              <Text>Projects-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="projects-1A" textValue="Projects-1A">
              <TreeItemContent>
                <Text>Projects-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="projects-2" textValue="Projects-2">
            <TreeItemContent>
              <Text>Projects-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="projects-3" textValue="Projects-3">
            <TreeItemContent>
              <Text>Projects-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
        <TreeViewItem id="school" textValue="school">
          <TreeItemContent>
            <Text>School</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="homework-1" textValue="homework-1">
            <TreeItemContent>
              <Text>Homework-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="homework-1A" textValue="homework-1A">
              <TreeItemContent>
                <Text>Homework-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="homework-2" textValue="homework-2">
            <TreeItemContent>
              <Text>Homework-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="homework-3" textValue="homework-3">
            <TreeItemContent>
              <Text>Homework-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
    ),
    allInteractionsDisabled: () => render(
      <TreeView aria-label="test tree" selectionMode="single" disabledKeys={['school']} disabledBehavior="all">
        <TreeViewItem id="Photos" textValue="Photos">
          <TreeItemContent>
            <Text>Photos</Text>
            <Folder />
          </TreeItemContent>
        </TreeViewItem>
        <TreeViewItem id="projects" textValue="Projects">
          <TreeItemContent>
            <Text>Projects</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="projects-1" textValue="Projects-1">
            <TreeItemContent>
              <Text>Projects-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="projects-1A" textValue="Projects-1A">
              <TreeItemContent>
                <Text>Projects-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="projects-2" textValue="Projects-2">
            <TreeItemContent>
              <Text>Projects-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="projects-3" textValue="Projects-3">
            <TreeItemContent>
              <Text>Projects-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
        <TreeViewItem id="school" textValue="school">
          <TreeItemContent>
            <Text>School</Text>
            <Folder />
          </TreeItemContent>
          <TreeViewItem id="homework-1" textValue="homework-1">
            <TreeItemContent>
              <Text>Homework-1</Text>
              <Folder />
            </TreeItemContent>
            <TreeViewItem id="homework-1A" textValue="homework-1A">
              <TreeItemContent>
                <Text>Homework-1A</Text>
                <FileTxt />
              </TreeItemContent>
            </TreeViewItem>
          </TreeViewItem>
          <TreeViewItem id="homework-2" textValue="homework-2">
            <TreeItemContent>
              <Text>Homework-2</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
          <TreeViewItem id="homework-3" textValue="homework-3">
            <TreeItemContent>
              <Text>Homework-3</Text>
              <FileTxt />
            </TreeItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
    )
  }
});
