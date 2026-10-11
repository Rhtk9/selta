import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MinhasPlantasPage } from './minhas-plantas.page';

describe('MinhasPlantasPage', () => {
  let component: MinhasPlantasPage;
  let fixture: ComponentFixture<MinhasPlantasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MinhasPlantasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
