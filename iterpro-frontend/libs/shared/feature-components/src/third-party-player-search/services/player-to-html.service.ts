import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

const toLabelValue = (label, value) => `
  <div>
    <span class="player-tooltip-content-label">${label}</span>
    <span>${value ? value : '-'}</span>
  </div>
`;

@Injectable({
	providedIn: 'root'
})
export class PlayerToHtmlService {
	private t;
	private m;

	constructor(translate: TranslateService, millions: ShortNumberPipe, private currentTeamService: CurrentTeamService) {
		this.t = translate.instant.bind(translate);
		this.m = millions.transform.bind(millions);
	}

	renderSpinner(loading) {
		if (!loading) return '';
		return `
      <span class="loader"></span>
    `;
	}

	renderCarreer(player) {
		if (!player.careerData || !player.careerData.length) return '';
		const renderItem = item => `
      <div>
        <div style="width: 30%;">${item.team ? item.team.name : '-'}</div>
        <div style="width: 30%;">${item.competition ? item.competition.name : '-'}</div>
        <div style="width: 20%;">${item.season ? item.season.name : '-'}</div>
        <div style="width: 10%;">${item.appearances || item.appearances === 0 ? item.appearances : '-'}</div>
        <div style="width: 10%;">${item.goal || item.goal === 0 ? item.goal : '-'}</div>
      </div>
    `;
		return `
      <div class="player-tooltip-table">
        <div class="player-tooltip-table-header">
          <div class="player-tooltip-table-th" style="padding-right: ${player.careerData.length > 10 ? 10 : 0}px;">
            <div style="width: 30%;">Team</div>
            <div style="width: 30%;">Competition</div>
            <div style="width: 20%;">Season</div>
            <div style="width: 10%;">Apps</div>
            <div style="width: 10%;">Goal</div>
          </div>
        </div>
        <div class="player-tooltip-table-body">
          ${player.careerData.map(renderItem).join('')}
        </div>
      </div>
    `;
	}

	toText(player, loading) {
		return `
      <div class="player-tooltip">
        <h4>${player.shortName} ${this.renderSpinner(loading)} <span class="already-label">${
			player.alreadyImported ? this.t('wysearch.already') : ''
		}</span></h4>
        <div class="player-tooltip-content">
          <div class="player-tooltip-content-img">
            <img style="background-color:white" src="${player.img || 'assets/img/default_icon.png'}" />
          </div>
          <div class="player-tooltip-content-info">
            ${toLabelValue(
							'Birthdate',
							player.birthDate && moment(player.birthDate).format(getMomentFormatFromStorage())
						)}
            ${toLabelValue('Club', player.currentTeam && player.currentTeam.officialName)}
            ${toLabelValue('Position', player.role && player.role.name)}
            ${toLabelValue(
							`Value (${this.currentTeamService.getCurrency()})`,
							player.transferValue && this.m(player.transferValue, true)
						)}
            ${this.renderCarreer(player)}
          </div>
        </div>
      </div>
    `;
	}

	toHtml(player, loading) {
		return `<div class="pl-tooltip">${this.toText(player, loading)}</div>`;
	}
}
