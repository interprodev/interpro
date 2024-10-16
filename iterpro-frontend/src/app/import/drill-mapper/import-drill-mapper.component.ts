import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Drill } from '@iterpro/shared/data-access/sdk';
import { Labelled, SplitAssociation } from 'src/app/+state/import-store/interfaces/import-store.interfaces';

@Component({
	selector: 'iterpro-drill-mapper',
	templateUrl: './import-drill-mapper.component.html',
	styleUrls: ['./../import.common.css', './import-drill-mapper.component.css']
})
export class ImportDrillMapperComponent {
	@Input() drills: Array<Labelled<Drill>>;
	@Input() splits: SplitAssociation[];
	@Output() update: EventEmitter<SplitAssociation[]> = new EventEmitter<SplitAssociation[]>();

	selectedDrill(name: string) {
		return this.drills.find(drill => drill.importLabel === name);
	}

	changeMapping({ value }: { value: Labelled<Drill> }, split: SplitAssociation) {
		split = { ...split, drillName: value.importLabel, drillId: value.id };
		this.update.emit(this.replaceSplit(this.splits, split));
	}

	toggleDrillConversion(split: SplitAssociation) {
		split = {
			...split,
			toConvert: !split.toConvert
		};
		this.update.emit(this.replaceSplit(this.splits, split));
	}

	toggleImportAsNew(split: SplitAssociation) {
		const newDrill = !split.newDrill;
		split = {
			...split,
			newDrill,
			drillName: newDrill ? split.splitName : split.drillName,
			drillId: newDrill ? undefined : split.drillId
		};
		this.update.emit(this.replaceSplit(this.splits, split));
	}

	private replaceSplit(splitAssociations: SplitAssociation[], splitAssociation: SplitAssociation) {
		return splitAssociations.map((split, index) => (splitAssociation.index === index ? splitAssociation : split));
	}
}
