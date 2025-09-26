import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsreaderComponent } from './newsreader.component';

describe('NewsreaderComponent', () => {
  let component: NewsreaderComponent;
  let fixture: ComponentFixture<NewsreaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewsreaderComponent]
    });
    fixture = TestBed.createComponent(NewsreaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
