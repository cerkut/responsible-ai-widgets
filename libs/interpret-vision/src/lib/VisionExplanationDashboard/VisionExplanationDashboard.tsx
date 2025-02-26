// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  IDropdownOption,
  Stack,
  PivotItem,
  Slider,
  Separator,
  Text,
  mergeStyles
} from "@fluentui/react";
import {
  defaultModelAssessmentContext,
  IVisionListItem,
  ModelAssessmentContext
} from "@responsible-ai/core-ui";
import { localization } from "@responsible-ai/localization";
import React from "react";

import { CohortToolBar } from "./Controls/CohortToolBar";
import { Flyout } from "./Controls/Flyout";
import { imageListStyles } from "./Controls/ImageList.styles";
import { PageSizeSelectors } from "./Controls/PageSizeSelectors";
import { Pivots } from "./Controls/Pivots";
import { TabsView } from "./Controls/TabsView";
import { ToolBar } from "./Controls/ToolBar";
import { IVisionExplanationDashboardProps } from "./Interfaces/IVisionExplanationDashboardProps";
import { IVisionExplanationDashboardState } from "./Interfaces/IVisionExplanationDashboardState";
import { visionExplanationDashboardStyles } from "./VisionExplanationDashboard.styles";
import {
  preprocessData,
  getItems,
  defaultState,
  VisionDatasetExplorerTabOptions,
  defaultImageSizes,
  getCohort
} from "./VisionExplanationDashboardHelper";
export class VisionExplanationDashboard extends React.Component<
  IVisionExplanationDashboardProps,
  IVisionExplanationDashboardState
> {
  public static contextType = ModelAssessmentContext;
  public context: React.ContextType<typeof ModelAssessmentContext> =
    defaultModelAssessmentContext;
  private originalErrorInstances: IVisionListItem[] = [];
  private originalSuccessInstances: IVisionListItem[] = [];
  public constructor(props: IVisionExplanationDashboardProps) {
    super(props);
    this.state = defaultState;
  }
  public componentDidMount(): void {
    const data = preprocessData(this.props, this.context.dataset);
    if (!data) {
      return;
    }
    this.originalErrorInstances = data.errorInstances;
    this.originalSuccessInstances = data.successInstances;
    this.setState(data);
  }
  public componentDidUpdate(prevProps: IVisionExplanationDashboardProps): void {
    if (this.props.selectedCohort !== prevProps.selectedCohort) {
      this.setState(
        getItems(
          this.props,
          this.originalErrorInstances,
          this.originalSuccessInstances
        )
      );
    }
  }
  public render(): React.ReactNode {
    const classNames = visionExplanationDashboardStyles();
    const imageStyles = imageListStyles();
    return (
      <Stack
        horizontal={false}
        grow
        tokens={{ childrenGap: "l1", padding: "m 40px" }}
      >
        <Stack.Item>
          <Pivots
            selectedKey={this.state.selectedKey}
            onLinkClick={this.handleLinkClick}
          />
        </Stack.Item>
        <Stack.Item>
          <Separator styles={{ root: { width: "100%" } }} />
        </Stack.Item>
        <Stack.Item>
          <ToolBar
            cohorts={this.props.cohorts}
            searchValue={this.state.searchValue}
            onSearch={this.onSearch}
            selectedCohort={this.props.selectedCohort}
            setSelectedCohort={this.props.setSelectedCohort}
          />
        </Stack.Item>
        <Stack.Item>
          <Stack
            horizontal
            horizontalAlign="space-between"
            verticalAlign="start"
          >
            <Stack.Item>
              <Slider
                max={80}
                min={20}
                className={classNames.slider}
                label={localization.InterpretVision.Dashboard.thumbnailSize}
                defaultValue={50}
                showValue={false}
                onChange={this.onSliderChange}
                disabled={
                  this.state.selectedKey ===
                  VisionDatasetExplorerTabOptions.DataCharacteristics
                }
              />
            </Stack.Item>
            {this.state.selectedKey !==
            VisionDatasetExplorerTabOptions.ImageExplorerView ? (
              <Stack.Item>
                <PageSizeSelectors
                  selectedKey={this.state.selectedKey}
                  onNumRowsSelect={this.onNumRowsSelect}
                  onPageSizeSelect={this.onPageSizeSelect}
                />
              </Stack.Item>
            ) : (
              <Stack
                horizontal
                tokens={{ childrenGap: "l1" }}
                verticalAlign="center"
              >
                <Stack.Item>
                  <Text>
                    {localization.InterpretVision.Dashboard.predictedLabel}
                  </Text>
                </Stack.Item>
                <Stack.Item
                  className={mergeStyles(
                    imageStyles.errorIndicator,
                    classNames.legendIndicator
                  )}
                >
                  <Text className={imageStyles.labelPredicted}>
                    {localization.InterpretVision.Dashboard.legendFailure}
                  </Text>
                </Stack.Item>
                <Stack.Item
                  className={mergeStyles(
                    imageStyles.successIndicator,
                    classNames.legendIndicator
                  )}
                >
                  <Text className={imageStyles.labelPredicted}>
                    {localization.InterpretVision.Dashboard.legendSuccess}
                  </Text>
                </Stack.Item>
              </Stack>
            )}
          </Stack>
        </Stack.Item>
        {this.state.selectedKey ===
          VisionDatasetExplorerTabOptions.TableView && (
          <Stack.Item>
            <CohortToolBar
              addCohort={this.addCohortWrapper}
              cohorts={this.props.cohorts}
              selectedIndices={this.state.selectedIndices}
            />
          </Stack.Item>
        )}
        <Stack.Item>
          <TabsView
            addCohort={this.addCohortWrapper}
            errorInstances={this.state.errorInstances}
            successInstances={this.state.successInstances}
            imageDim={this.state.imageDim}
            numRows={this.state.numRows}
            otherMetadataFieldNames={this.state.otherMetadataFieldNames}
            pageSize={this.state.pageSize}
            searchValue={this.state.searchValue}
            selectedItem={this.state.selectedItem}
            selectedKey={this.state.selectedKey}
            onItemSelect={this.onItemSelect}
            updateSelectedIndices={this.updateSelectedIndices}
            selectedCohort={this.props.selectedCohort}
            setSelectedCohort={this.props.setSelectedCohort}
          />
        </Stack.Item>
        <Stack.Item>
          <Flyout
            explanations={this.state.computedExplanations}
            isOpen={this.state.panelOpen}
            item={this.state.selectedItem}
            loadingExplanation={this.state.loadingExplanation}
            otherMetadataFieldNames={this.state.otherMetadataFieldNames}
            callback={this.onPanelClose}
            onChange={this.onItemSelect}
          />
        </Stack.Item>
      </Stack>
    );
  }
  private updateSelectedIndices = (indices: number[]): void => {
    this.setState({ selectedIndices: indices });
  };
  private addCohortWrapper = (name: string, switchCohort: boolean): void => {
    this.context.addCohort(
      getCohort(name, this.state.selectedIndices, this.context.jointDataset),
      switchCohort
    );
  };
  private onPanelClose = (): void => {
    this.setState({ panelOpen: !this.state.panelOpen });
  };
  private onSearch = (
    _event?: React.ChangeEvent<HTMLInputElement>,
    newValue?: string
  ): void => {
    this.setState({ searchValue: newValue || "" });
  };
  private onItemSelect = (item: IVisionListItem, selectedObject = -1): void => {
    this.setState({ panelOpen: true, selectedItem: item });
    const { computedExplanations, loadingExplanation } = this.state;
    if (selectedObject !== -1) {
      if (computedExplanations.get(item.index)?.get(selectedObject)) {
        loadingExplanation[item.index][selectedObject] = false;
        this.setState({
          loadingExplanation
        });
        return;
      }
    }
    if (this.props.requestExp && selectedObject !== -1) {
      loadingExplanation[item.index][selectedObject] = true;
      this.setState({ loadingExplanation });
      this.props
        .requestExp([item.index, selectedObject], new AbortController().signal)
        .then((result) => {
          computedExplanations
            .get(item.index)
            ?.set(selectedObject, result.toString());
          computedExplanations.set(
            item.index,
            computedExplanations.get(item.index) ??
              new Map().set(selectedObject, result.toString())
          );
          loadingExplanation[item.index][selectedObject] = false;
          this.setState({
            computedExplanations,
            loadingExplanation
          });
        });
    }
  };
  /* For onSliderChange, the max imageDims per tab (400 and 100) are selected arbitrary to look like the Figma. 
  For handleLinkClick, the default are half the max values chosen in onSliderChange. */
  private onSliderChange = (value: number): void => {
    if (
      this.state.selectedKey ===
      VisionDatasetExplorerTabOptions.ImageExplorerView
    ) {
      this.setState({ imageDim: Math.floor((value / 100) * 400) });
    } else {
      this.setState({ imageDim: Math.floor((value / 100) * 100) });
    }
  };
  private onNumRowsSelect = (
    _event: React.FormEvent<HTMLDivElement>,
    item: IDropdownOption | undefined
  ): void => {
    this.setState({ numRows: Number(item?.text) });
  };
  private onPageSizeSelect = (
    _event: React.FormEvent<HTMLDivElement>,
    item: IDropdownOption | undefined
  ): void => {
    this.setState({ pageSize: Number(item?.text) });
  };
  private handleLinkClick = (item?: PivotItem): void => {
    if (item && item.props.itemKey !== undefined) {
      this.setState({ selectedKey: item.props.itemKey });
      switch (item.props.itemKey) {
        case VisionDatasetExplorerTabOptions.ImageExplorerView:
          this.setState({ imageDim: defaultImageSizes.imageExplorerView });
          break;
        case VisionDatasetExplorerTabOptions.TableView:
          this.setState({ imageDim: defaultImageSizes.tableView });
          break;
        default:
          this.setState({ imageDim: defaultImageSizes.dataCharacteristics });
          break;
      }
    }
  };
}
