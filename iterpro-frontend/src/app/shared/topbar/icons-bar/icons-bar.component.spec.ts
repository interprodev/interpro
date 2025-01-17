/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { IconsBarComponent } from './icons-bar.component';

describe('IconsBarComponent', () => {
  let component: IconsBarComponent;
  let fixture: ComponentFixture<IconsBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IconsBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
