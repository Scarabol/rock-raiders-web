export abstract class Task {

    abstract isIncomplete(): boolean;

    abstract doIt();

    abstract cancel();

}