import { AsyncPipe, NgIf, NgStyle } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ChipsModule } from 'primeng/chips';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DragDropModule } from 'primeng/dragdrop';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InplaceModule } from 'primeng/inplace';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ListboxModule } from 'primeng/listbox';
import { MenuModule } from 'primeng/menu';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayModule } from 'primeng/overlay';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { PickListModule } from 'primeng/picklist';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SidebarModule } from 'primeng/sidebar';
import { SkeletonModule } from 'primeng/skeleton';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { TieredMenuComponent } from './tiered-menu/tiered-menu.component';
import { TabMenuModule } from 'primeng/tabmenu';

@NgModule({
	imports: [
		AccordionModule,
		ButtonModule,
		CalendarModule,
		ChartModule,
		CheckboxModule,
		ChipModule,
		ChipsModule,
		ColorPickerModule,
		ConfirmDialogModule,
		ContextMenuModule,
		DialogModule,
		DividerModule,
		DragDropModule,
		DropdownModule,
		DynamicDialogModule,
		FileUploadModule,
		InplaceModule,
		InputMaskModule,
		InputNumberModule,
		InputSwitchModule,
		InputTextModule,
		InputTextareaModule,
		KeyFilterModule,
		ListboxModule,
		MenuModule,
		MessagesModule,
		MultiSelectModule,
		OverlayModule,
		OverlayPanelModule,
		PanelModule,
		PickListModule,
		ProgressSpinnerModule,
		RadioButtonModule,
		RippleModule,
		SelectButtonModule,
		SharedModule,
		SidebarModule,
		SkeletonModule,
		SliderModule,
		TableModule,
		TabViewModule,
		ToggleButtonModule,
		TooltipModule,
		TieredMenuModule,
		NgIf,
		AsyncPipe,
		TranslateModule,
		NgStyle
	],
	exports: [
		AccordionModule,
		ButtonModule,
		CalendarModule,
		ChartModule,
		CheckboxModule,
		ChipModule,
		ChipsModule,
		ColorPickerModule,
		ConfirmDialogModule,
		ContextMenuModule,
		DialogModule,
		DividerModule,
		DragDropModule,
		DropdownModule,
		DynamicDialogModule,
		FileUploadModule,
		InplaceModule,
		InputMaskModule,
		InputNumberModule,
		InputSwitchModule,
		InputTextModule,
		InputTextareaModule,
		KeyFilterModule,
		ListboxModule,
		MenuModule,
		MessagesModule,
		MultiSelectModule,
		OverlayModule,
		OverlayPanelModule,
		PanelModule,
		PickListModule,
		ProgressSpinnerModule,
		RadioButtonModule,
		RippleModule,
		SelectButtonModule,
		SharedModule,
		SidebarModule,
		SkeletonModule,
		SliderModule,
		TableModule,
		TabViewModule,
		TabMenuModule,
		ToggleButtonModule,
		TooltipModule,
		TieredMenuModule,
		TieredMenuComponent,
	],
	declarations: [TieredMenuComponent]
})
export class PrimeNgModule {}
