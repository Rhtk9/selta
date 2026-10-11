import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplorarEspeciesPage } from './explorar-especies.page';

describe('ExplorarEspeciesPage', () => {
  let component: ExplorarEspeciesPage;
  let fixture: ComponentFixture<ExplorarEspeciesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorarEspeciesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
