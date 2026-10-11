import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompartilharPage } from './compartilhar.page';

describe('CompartilharPage', () => {
  let component: CompartilharPage;
  let fixture: ComponentFixture<CompartilharPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CompartilharPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
